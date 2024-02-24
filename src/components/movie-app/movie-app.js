import { Jetz, loop } from "../../lib/jetz";
import { link } from "../../lib/jetz-router";
import { a, css, div, href, i, li, main, ul } from "../../lib/jetz-ui";

const leftMenus = [
    { text: 'Home', icon: i( css`fa-regular fa-home` ), link: '/' },
    { text: 'Discovery', icon: i( css`fa-regular fa-compass` ), link: '#' },
    { text: 'Community', icon: i( css`fa-regular fa-users` ), link: '#' },
    { text: 'Coming Soon', icon: i( css`fa-regular fa-clock` ), link: '#' },
];
const topMenus = [ 
    { text: 'All', link: '/' },
    { text: 'Movies', link: '/' },
    { text: 'Series', link: 'series' },
    { text: 'Live TV', link: '/live-tv', params: { nama: 'deva explorer' } },
];

function sidebarLeft(){
    return [
        div( css`sidebar-space` ),
        div( css`sidebar-left`,
            ul( css`menu-list`,
                li( css`menu-item menu-static`, 'MENU'),
                loop(leftMenus, menu => (
                    li( css`menu-item`,
                        a( href(menu.link), menu.icon, menu.text )
                    )
                ))
            )
        )
    ];
}

function topbarMenu(){
    return (
        div( css`topbar-menu`,
            div( css`topbar-nav`,
                ul( css`topbar-menu-list`, 
                    loop(topMenus, menu => (
                        li( css`topbar-menu-item`,
                            link(menu.link, 
                                a( href(menu.link), menu.text),
                                menu.params
                            )
                        )
                    ))
                ),
                div( css`topbar-right`,
                    div(css`topbar-menu-item`,
                        a(href`#`, i( css`fa-regular fa-bell`))
                    ),
                    div(css`topbar-menu-item`,
                        a(href`#`, 'Login', {
                            onclick(){
                                fetch('http://localhost:11383/home/playlists')
                            }
                        })
                    )
                )
            ),
        )
    );
}

function mainContainer(){
    return [
        topbarMenu(),
        div(css`movie-container`, 
            Jetz.$route.browser()
        )
    ]
}

export const MovieApp = function(){
    return main( css`container-page`,
        sidebarLeft(),
        mainContainer()
    )
}