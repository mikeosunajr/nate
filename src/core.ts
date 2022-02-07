class AddWord {

}

class NumberWord {
    number: number;
    constructor(n: number) {
        this.number = n;
    }
}

export type Word = AddWord | NumberWord;

export function Add(): AddWord {
    return new AddWord()
}

export function Number(n: number): NumberWord {
    return new NumberWord(n)
}