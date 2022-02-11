export enum Kind {
  add,
  number,
}

export enum PrimitiveType {
  number,
}

export type Code = {
  input: Type;
  output: Type;
};

export type Type = PrimitiveType | Set<Type> | Array<Type>;

interface BaseWord {
  inputs: Array<Type>;
  outputs: Array<Type>;
}

class AddWord implements BaseWord {
  kind: Kind.add = Kind.add;
  inputs = [PrimitiveType.number, PrimitiveType.number];

  outputs = [PrimitiveType.number];
}

class NumberWord implements BaseWord {
  kind: Kind.number = Kind.number;
  number: number;
  inputs = [];

  outputs = [PrimitiveType.number];
  constructor(n: number) {
    this.number = n;
  }
}

export type Word = AddWord | NumberWord;

export function Add(): AddWord {
  return new AddWord();
}

export function Number(n: number): NumberWord {
  return new NumberWord(n);
}
