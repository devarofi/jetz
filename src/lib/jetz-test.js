import { JetzElement } from "./jetz";

class JTest {
    component;
    static new(components){
        return new JTest(components);
    }
    constructor(component) {
        if(component instanceof JetzElement){
            this.component = component;
            this.component.render(document.body);
        }
    }
    currentElement;
    find(selector){
        this.currentElement = this.component.o.querySelector(selector);
        return this;
    }
    click(){
        this.currentElement.click();
        return this;
    }
    text(){
        return this.currentElement.innerText;
    }
    html(){
        return this.currentElement.innerHTML;
    }
    element(){
        return this.currentElement.$;
    }
}

export default JTest;