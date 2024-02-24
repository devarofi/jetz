import { stateOf } from "../../lib/jetz";
import { b, div, h2, p } from "../../lib/jetz-ui";
import { mBtnLight, mCol12, mInputTextField, mRow } from "../materialize/material-components";

class User {
    fullname;
    role;
    constructor(fullname, role){
        this.fullname = fullname;
        this.role = role;
    }
}

let userState = stateOf(new User('Deva', 'Administrator'));
let stateCounter = stateOf(0);

export let contactComponent = mRow(
    mCol12(
        h2('Contact US', stateCounter),
        div(
            b(userState.fullname),
            p(userState.role)
        ),
        mBtnLight('Ubah Pengguna').on('click', () => {
            console.log(userState.fullname)
            userState.fullname.value = 'Arofi'
            userState.role.value = 'Super admin'
            stateCounter.value += 1;
        }),
        mInputTextField('my-input-field', 'Fullname').on('keyup', function(){
            userState.fullname.value = this.value();
        })
    )
)