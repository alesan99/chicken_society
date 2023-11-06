class Button {
    constructor(label, action) {
        this.label = label;
        this.action = action;
    }

    click() {
        this.action();
    }
}