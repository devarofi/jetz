import { Jetz } from "./src/lib/jetz";
import { MovieApp } from './src/components/movie-app/movie-app';
import { Router, route } from "./src/lib/jetz-router";
import { MovieDetail } from "./src/components/movie-app/movie-detail";
import { MovieHome } from "./src/components/movie-app/movie-home";
import { MovieSeries } from "./src/components/movie-app/movie-series";
import MovieLiveTv from "./src/components/movie-app/movie-livetv";
import('./public/css/movie-app.css');

// sample router
let router = new Router(
    route('/', MovieHome),
    route('movie-detail', MovieDetail),
    route('series', MovieSeries),
    route('live-tv', MovieLiveTv)
);
// add router in Jetz project
Jetz.use(router);

Jetz.mount(MovieApp, document.body);