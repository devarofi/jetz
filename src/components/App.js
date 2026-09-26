import { footer, main } from  "../lib/jetz-ui.js";
import { Jetz, stateOf, _else, _if } from "../lib/jetz.js";

export const App = function(){
    return main(
        Jetz.$route.browser(),
        footer('Author @daevsoft')
    )
}