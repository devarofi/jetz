import { Component } from "../../lib/jetz";
import { css, div, h1, p } from "../../lib/jetz-ui";

class MovieLiveTv extends Component {
    render(){
        return div( css`page-container`,
            h1('This is live TV Shows'),
            p(`Hai ${this.$params.nama}`)
        )
    }
}

export default MovieLiveTv