export interface Instance {
  _id?: string;
  name: string;
  volumeID: string;
}

export interface Volume {
  _id?: string;
  name: string;

  files: any;
}
