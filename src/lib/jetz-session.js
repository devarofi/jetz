import { rememberOf } from "./jetz";

export class JetzSession {
    session_id = 'app_session';

    data = {};
    dataProxy;
    savedData;

    save(){
        this.savedData.value = this.data;
    }

    get(key){
        if(this.savedData.hasOwnProperty(key))
            return this.savedData[key];
        return this[key];
    }
    set(key, value){
        this.savedData[key] = value;
        this.save();
        return true;
    }
    setInitialData(data){
        const oldData = sessionStorage.getItem(this.session_id);
        if(oldData){
            this.savedData = JSON.parse(oldData);
        }else{
            this.savedData = data;
            this.save();
        }
    }
    destroy(){
        sessionStorage.removeItem(this.session_id);
    }
    save(){
        sessionStorage.setItem(this.session_id, JSON.stringify(this.savedData));
    }

    constructor(data){
        console.log('Created')
        this.setInitialData(data);
        this.dataProxy = new Proxy(this, {
            get(target, prop){
                return target.get(prop);
            },
            set(target, prop, value){
                return target.set(prop, value);
            }
        });
    }

    install(context){
        context.$session = this.dataProxy;
        console.log('Session was installed')
    }
}

export function sessionOf(data){
    return (new JetzSession(data)).dataProxy;
}
