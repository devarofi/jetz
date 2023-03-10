import { footer, main } from  "../lib/jetz-ui";
import { Jetz, stateOf, _else, _if } from "../lib/jetz";

export const App = function(){
    return main(
        Jetz.$route.browser(),
        footer('Author @daevsoft')
    )
}