import { Jetz, loop } from "../../lib/jetz";
import { alt, b, br, button, css, div, h1, h2, h3, h4, i, img, li, name, p, span, src, type, ul, width } from "../../lib/jetz-ui";

let movie = {};

function topBanner(){
    return div( css`top-banner-container`,
        img( src(movie.banner), width`100%`, alt(movie.title)),
        div( css`top-banner-layout`,
            div( css`top-banner-controls`,
                div( css`top-banner-control-left`, 
                    button( css`btn-back-banner`, type`button`, name`back-state`,{
                        onclick(){
                            Jetz.$route.back();
                        }
                    },
                        i( css`fa fa-chevron-left`)
                    ),
                    b(movie.title)
                ),
                div( css`top-banner-control-right`,
                    span('MOVIES')
                )
            ),
            div( css`bottom-banner-controls`,
                div( css`control-left`,
                    div( css`rating`, movie.rating),
                    div(
                        b('35.6K VOTES'),br(),
                        div( css`vote-text`, 'Our Users Are Recommending It')
                    )
                ),
                button( css`btn-trailer`,  type`button`, name`play-trailer`,
                    i( css`fa fa-play`), 'TRAILER'
                ),
                div()
            ),
        )
    )
}
export let MovieDetail = function(_movie = {}){
    movie = _movie;
    return div( css`movie-detail-container`,
        topBanner(),
        div( css`movie-detail-info`,
            div( css`side-detail-left`,
                img( src(movie.poster), width`160px`),
                h3(movie.year, br(), '1H 37MIN', br(), 'PG13')
            ),
            div( css`side-detail-center`, 
                h1(movie.title),
                ul( css`category-horizontal`,
                    loop(movie.genres, genre => (
                        li(genre)
                    ))
                ),
                div( css`movie-control-buttons`,
                    button( css`btn-movie btn-movie-watch`, type`button`, name`watch`, 
                        i( css`fa fa-play`), 'WATCH'),
                    button( css`btn-movie`, type`button`, name`watch`, 
                        i( css`fa fa-heart`)),
                    button( css`btn-movie`, type`button`, name`watch`, 
                        i( css`fa fa-share-nodes`)),
                    button( css`btn-movie`, type`button`, name`watch`, 
                        i( css`fas fa-ellipsis`)),
                ),
                div( css`story-cast-panel`,
                    div( css`storyline-panel`,
                        h3( css`storyline-title`, 'STORYLINE'),
                        p(movie.storyline)
                    ),
                    div( css`cast-panel`,
                        h2('CAST'),
                        ul( css`cast-list`,
                                loop((0).range(2), _ => (           
                                    li( css`cast-item`,
                                        img( src(`https://img.freepik.com/free-photo/handsome-young-man-with-new-stylish-haircut_176420-19636.jpg`)),
                                        b('Tom Hardy'),
                                        'Peter Parker'
                                    )
                                ))
                        )
                    )
                ),
            ),
            div( css`side-detail-right`,
                h2('More like this'),
                ul( css`more-movie-list`,
                    li( css`more-movie-item`,
                        img( src(movie.poster), width`100px`),
                        div( css`more-item-desc`,
                            h4('Avengers : Age Of Ultron'),
                            div( css`rating`, '8.3')
                        )
                    )
                )
            ),
        )
    )
}