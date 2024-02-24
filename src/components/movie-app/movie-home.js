import { loop } from "../../lib/jetz";
import { link } from "../../lib/jetz-router";
import { a, alt, button, css, div, find, findAll, h3, height, href, i, id, img, li, onScroll, src, ul, width } from "../../lib/jetz-ui";

const sampleMovie = {
    title: 'Spiderman',
    link: '#',
    rating: 8.1,
    year: 2021,
    genres: [ 'action', 'adventure', 'sci-fi' ],
    image: 'https://res-mola01-assets.mola.tv/image/0dc974c5-4c4d-45e9-90c6-8b4afc5fcafe/image.jpeg',
    poster: 'https://images.tokopedia.net/img/cache/700/product-1/2020/2/6/batch-upload/batch-upload_299afb3b-9bad-447b-8529-294003735135.jpg',
    banner: 'https://2.bp.blogspot.com/-OLadcDqc_1E/W4a7KP8ueTI/AAAAAAAAAkY/csD0w3EyugokdZgSLTA3a3TBRUFqMSqXgCLcBGAs/w1200-h630-p-k-no-nu/56d08afac2373d28733fe3e4d987b20a.jpg',
    storyline: `Spider-Man is a 2002 American superhero film based on the Marvel 
                Comics superhero of the same title. Directed by Sam Raimi from a 
                screenplay by David Koepp, it is the first installment in Raimi's 
                Spider-Man trilogy, and stars Tobey Maguire as the titular character, 
                alongside Willem Dafoe, Kirsten Dunst, James Franco, Cliff Robertson, 
                and Rosemary Harris. The film chronicles Spider-Man's origin story and early
                superhero career. After being bitten by a genetically-altered spider, outcast teenager 
                Peter Parker develops spider-like superhuman abilities and adopts a masked superhero
                identity to fight crime and injustice in New York City, facing the sinister Green 
                Goblin (Dafoe) in the process.`
};

function banners(){
    let isDown = false;
    let startX;
    let scrollLeft;
    let scrollEvent = {
        onmousedown(e){
            let slider = find('#banner-slider');
            isDown = true;
            slider.classList.add('active');
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        },
        onmouseleave(e){
            let slider = find('#banner-slider');
            isDown = false;
            slider.classList.remove('active');
        },
        onmouseup(e){
            let slider = find('#banner-slider');
            isDown = false;
            slider.classList.remove('active');
        },
        onmousemove(e){
            let slider = find('#banner-slider');
            if(!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX);
            slider.scrollLeft = scrollLeft - walk;
        },
    };
    return ul(
        loop((0).range(5), () => {
            return li( css`banner-item`, scrollEvent,
                img( src(sampleMovie.image), width`100%`, height`100%`),
                div( css`banner-item-info`,
                    h3(sampleMovie.title),
                    div( css`banner-year`, sampleMovie.year),
                    div( css`banner-rating`, `${sampleMovie.rating} rating`),
                    div( css`banner-buttons`,
                        a( css`btn-watchnow`, 'Watch now'),
                        button( css`btn-watchlist-plus`, i( css`fa fa-plus`) )
                    )
                )
            )
        })
    );
}

function bannerMovies(){
    return div( css`content-container`,
        h3( css`header-category`, 'Trending movies', a(href`#`, 'See all')),
        div( css`banner-wrapper`, id`banner-slider`, 
            onScroll(e => {
                let bannerSlider = find('#banner-slider');
                let bannerSliderItem = findAll('.banner-item');
                let btnScrollRight = find('.btn-scroll-right').instance;
                let btnScrollLeft = find('.btn-scroll-left').instance;
                let maxWidth = bannerSlider.offsetWidth - bannerSlider.scrollLeft;
                if(maxWidth < 200)
                    btnScrollRight.hide();
                else{
                    btnScrollRight.show();
                }
                if(e.target.scrollLeft < 50){
                    btnScrollLeft.hide();
                }else{
                    btnScrollLeft.show();
                }
            }), 
            banners()
        ),
        button( css`btn-scroll btn-scroll-right`, {
            onclick(){
                let slider = find('#banner-slider');
                let slide = find('.banner-item');
                slider.scroll({
                    left: slider.scrollLeft + slide.offsetWidth,
                    behavior: 'smooth',
                })
            }
        },
        i( css`fa-solid fa-chevron-right`)),

        button( css`btn-scroll btn-scroll-left`, {
            onclick(){
                let slider = find('#banner-slider');
                let slide = find('.banner-item');
                slider.scroll({
                    left: slider.scrollLeft - slide.offsetWidth,
                    behavior: 'smooth',
                })
            }
        },
        i( css`fa-solid fa-chevron-left`)).hide()
    )
}

function playlistSections(){
    return div( css`content-container`,
        h3( css`header-category`, 'Top Rated ', i( css`fa fa-star text-yellow`), 
            a(href`#`, 'See all')
        ),
        div( css`movie-cards`,
            loop((0).range(30), _ => {
                return link('movie-detail',
                            div( css`movie-card`,
                                img( src(sampleMovie.poster), alt`movie image`, width`100%`, height`250px`),
                                div( css`movie-card-title`, 'The Avengers')
                            ),
                            sampleMovie
                        )
            })
        )        
    );
}

export let MovieHome = div( css`page-container`,
    bannerMovies(),
    playlistSections()
);