import fs from "fs";
import path from "path";

export class PermanentStore<T extends { id: string }> {
  private storeDirectoryPath: string;
  private fileName: string;
  private updateCallback: (items: T[]) => void;

  constructor(props: { storeDirectoryPath: string; fileName: string; updateCallback?: (items: T[]) => void }) {
    this.storeDirectoryPath = props.storeDirectoryPath;
    this.fileName = props.fileName;
    this.updateCallback = props.updateCallback || (() => {});
  }

  private isOK(): boolean {
    return this.storeDirectoryPath !== "" && this.fileName !== "";
  }

  public fetchAll(): T[] {
    if (!this.isOK()) {
      throw new Error("storeDirectoryPath or fileName is not set");
    }

    this.initialize();
    return JSON.parse(fs.readFileSync(this.fileFullPath, "utf-8"));
  }

  public append(data: T) {
    this.initialize();

    const currentData: T[] = JSON.parse(fs.readFileSync(this.fileFullPath, "utf-8"));
    currentData.push(data);
    this.write(currentData);
  }

  public update(data: T) {
    this.initialize();

    const currentData: T[] = JSON.parse(fs.readFileSync(this.fileFullPath, "utf-8"));
    const newData = currentData.map((item) => {
      if (item.id === data.id) {
        return {
          ...data,
          id: item.id,
        };
      }
      return item;
    });
    this.write(newData);
  }

  private get fileFullPath() {
    if (!this.storeDirectoryPath) {
      throw new Error("storeDirectoryPath is not set");
    }
    if (!this.fileName) {
      throw new Error("fileName is not set");
    }
    return path.join(this.storeDirectoryPath, this.fileName);
  }

  private initialize() {
    if (!fs.existsSync(this.storeDirectoryPath)) {
      fs.mkdirSync(this.storeDirectoryPath, { recursive: true });
    }
    if (!fs.existsSync(this.fileFullPath) || fs.readFileSync(this.fileFullPath, "utf-8") === "") {
      this.write([]);
    }
  }

  private write(data: T[]) {
    fs.writeFileSync(this.fileFullPath, JSON.stringify(data, undefined, 2), "utf-8");
    this.updateCallback(data);
  }
}
