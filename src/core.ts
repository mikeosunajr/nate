export enum Kind {
  add,
  number,
}

export enum TypeKinds {
  number,
}

export class TNumber {
  kind: TypeKinds.number = TypeKinds.number;
}

export type Type = TNumber;

class AddWord {
  kind: Kind.add = Kind.add;
}

class NumberWord {
  kind: Kind.number = Kind.number;
  number: number;
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

export function NumberT(): TNumber {
  return new TNumber();
}
