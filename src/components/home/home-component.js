import { link } from "../../lib/jetz-router.js";
import { a, alt, br, button, div, h1, href, img, main, p, src, width } from "../../lib/jetz-ui.js";
import { stateOf, _else, _if } from "../../lib/jetz.js";
import logo from '../../../public/img/logo/small.png';
import '../../../public/css/style.css';

export function Home(){
    let counter = stateOf(0)

    return main(
        img( src(logo), alt`jetz logo`, width`200`),
        h1('Jetz JS'),
        p('Composable Javascript without sweat'),

        div('Count : ',counter),
        button('Add', {
            onclick(){
                counter.value++;
            }
        }),
        a( href`https://github.com/devarofi/jetz`, 'Get started'),
        br(),
        link('open-todo', button('Open ToDo'))
    )
}