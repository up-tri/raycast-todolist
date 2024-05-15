import { Action, ActionPanel, Form, Icon, List, getPreferenceValues, useNavigation } from "@raycast/api";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useState } from "react";
import { nanoid } from "./lib/nanoid";
import { PermanentStore } from "./lib/permanentStore";

type Preferences = {
  "data-directory-path": string;
};

type Todo = {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  dueDate: Date | null;
};
type DisplayTodo = Todo & { dayjsDueDate: Dayjs };
const DATE_FORMAT = "YYYY/MM/DD";

function createDisplayTodoFrom(todo: Todo): DisplayTodo {
  return {
    ...todo,
    dayjsDueDate: dayjs(todo.dueDate),
  };
}

function CreateTodoForm(props: { onCreate: (todo: Todo) => void }) {
  const { pop } = useNavigation();
  function handleSubmit(values: { title: string; description: string; dueDate: Date }) {
    props.onCreate({
      id: nanoid(),
      title: values.title,
      description: values.description,
      isCompleted: false,
      dueDate: values.dueDate,
    });
    pop();
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Todo" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title="Title" />
      <Form.TextArea id="description" title="Description" enableMarkdown />
      <Form.DatePicker id="dueDate" title="Due Date" />
    </Form>
  );
}

function CreateTodoAction(props: { onCreate: (todo: Todo) => void }) {
  return (
    <Action.Push
      icon={Icon.Pencil}
      title="Create Todo"
      shortcut={{ modifiers: ["cmd"], key: "n" }}
      target={<CreateTodoForm onCreate={props.onCreate} />}
    />
  );
}

function EditTodoForm(props: { todo: Todo; onSave: (todo: Todo) => void }) {
  const [todo, setTodo] = useState<Todo>(props.todo);
  const { pop } = useNavigation();
  function handleSubmit() {
    props.onSave(todo);
    pop();
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Todo" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="title"
        title="Title"
        value={todo.title}
        onChange={(v) =>
          setTodo({
            ...todo,
            title: v,
          })
        }
      />
      <Form.TextArea
        id="description"
        title="Description"
        enableMarkdown
        value={todo.description}
        onChange={(v) =>
          setTodo({
            ...todo,
            description: v,
          })
        }
      />
      <Form.DatePicker
        id="dueDate"
        title="Due Date"
        value={todo.dueDate}
        onChange={(v) =>
          setTodo({
            ...todo,
            dueDate: v,
          })
        }
      />
      <Form.Checkbox
        id="isCompleted"
        title="Is Completed"
        label="Is Completed"
        value={todo.isCompleted}
        onChange={(v) => {
          console.log("isCompleted: ", v);
          setTodo({
            ...todo,
            isCompleted: v,
          });
        }}
      />
    </Form>
  );
}

function EditTodoAction(props: { todo: Todo; onSave: (todo: Todo) => void }) {
  return (
    <Action.Push
      icon={Icon.Cog}
      title="Edit Todo"
      shortcut={{ modifiers: ["cmd"], key: "e" }}
      target={<EditTodoForm todo={props.todo} onSave={props.onSave} />}
    />
  );
}

function guessDate(input: string): Date | null {
  if (["today", "now", "今日"].includes(input)) {
    return new Date();
  }
  if (input === "tomorrow") {
    return dayjs().add(1, "day").toDate();
  }

  const date = dayjs(input);
  if (date.isValid()) {
    return date.toDate();
  }
  return null;
}

function parseSearchQuery(query: string): {
  query: string | null;
  isCompleted: boolean | null;
  dueDateFrom: Date | null;
  dueDateTo: Date | null;
} {
  const queryParts = query.split(/\s+/);
  const result: {
    query: string | null;
    isCompleted: boolean | null;
    dueDateFrom: Date | null;
    dueDateTo: Date | null;
  } = {
    query: null,
    isCompleted: false,
    dueDateFrom: null,
    dueDateTo: null,
  };

  for (const part of queryParts) {
    if (part === "stauts:done") {
      result.isCompleted = true;
    } else if (part === "status:all") {
      result.isCompleted = null;
    } else if (part.startsWith("due:")) {
      const dueDate = part.slice(4);
      if (part.startsWith("due:>")) {
        result.dueDateFrom = guessDate(dueDate);
      } else if (part.startsWith("due:<")) {
        result.dueDateTo = guessDate(dueDate);
      } else {
        result.dueDateFrom = guessDate(dueDate);
        result.dueDateTo = guessDate(dueDate);
      }
    } else {
      result.query = part;
    }
  }

  return result;
}

export default function Command() {
  // 表示用のstate
  const [todos, setTodos] = useState<DisplayTodo[]>([]);
  const [searchCondition, setSearchCondition] = useState<{
    query: string | null;
    isCompleted: boolean | null;
    dueDateFrom: Date | null;
    dueDateTo: Date | null;
  }>({
    query: null,
    isCompleted: false,
    dueDateFrom: null,
    dueDateTo: null,
  });

  const preferences = getPreferenceValues<Preferences>();
  const permanentStore = new PermanentStore<Todo>({
    storeDirectoryPath: preferences["data-directory-path"],
    fileName: "todos.json",
    updateCallback: (items) => setTodos(items.map(createDisplayTodoFrom)),
  });

  // 初回読み込み
  useEffect(() => {
    setTodos(permanentStore.fetchAll().map(createDisplayTodoFrom));
  }, []);

  useEffect(() => {
    console.log(searchCondition);
  }, [searchCondition]);

  const displayTodos = todos.filter((todo) => {
    if (searchCondition.query && !todo.title.includes(searchCondition.query)) {
      return false;
    }

    if (searchCondition.isCompleted !== null && todo.isCompleted !== searchCondition.isCompleted) {
      return false;
    }

    if (searchCondition.dueDateFrom && todo.dueDate && searchCondition.dueDateFrom >= todo.dueDate) {
      return false;
    }

    if (searchCondition.dueDateTo && todo.dueDate && searchCondition.dueDateTo <= todo.dueDate) {
      return false;
    }

    return true;
  });

  return (
    <List
      filtering={false}
      onSearchTextChange={(text) => setSearchCondition(parseSearchQuery(text))}
      actions={
        <ActionPanel>
          <CreateTodoAction onCreate={(todo) => permanentStore.append(todo)} />
        </ActionPanel>
      }
    >
      {/* <List.Item
        icon={Icon.Pencil}
        title="新規作成"
        actions={
          <ActionPanel>
            <CreateTodoAction onCreate={(todo) => permanentStore.append(todo)} />
          </ActionPanel>
        }
      /> */}
      {displayTodos.map((todo, index) => (
        <List.Item
          key={index}
          icon={todo.isCompleted ? Icon.Checkmark : Icon.Circle}
          title={todo.title}
          detail={
            <List.Item.Detail
              markdown={todo.description}
              metadata={
                <List.Item.Detail.Metadata>
                  <List.Item.Detail.Metadata.Label title="Due Date" text={todo.dayjsDueDate.format(DATE_FORMAT)} />
                </List.Item.Detail.Metadata>
              }
            />
          }
          actions={
            <ActionPanel>
              <EditTodoAction
                todo={{
                  ...todo,
                }}
                onSave={(updatedTodo) => {
                  permanentStore.update(updatedTodo);
                }}
              />
              <Action
                title={todo.isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
                shortcut={{ modifiers: ["cmd"], key: "m" }}
                onAction={() => {
                  permanentStore.update({ ...todo, isCompleted: !todo.isCompleted });
                }}
              />
            </ActionPanel>
          }
          accessories={[
            ...(todo.dueDate !== null ? [{ text: `${todo.dayjsDueDate.format(DATE_FORMAT)}`, icon: Icon.Clock }] : []),
          ]}
        />
      ))}
    </List>
  );
}
