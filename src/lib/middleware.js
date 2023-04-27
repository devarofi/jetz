export class Middleware {
    next(data, _continue){
        return true;
    }
}

export function middleware( middlewares, ...routes){
    routes.forEach(route => {
        route.middlewares = middlewares;
    });
    return routes;
}