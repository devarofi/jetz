import { Component, Jetz, JetzElement, stateOf } from "./jetz";

export class Router {
    #varname = '$route';
    #stateTarget;
    #routes;

    constructor(...route) {
        this.#routes = route;
    }
    #initialNavigateListener(){
        navigation.addEventListener("navigate", (event) => {
            const { pathname } = new URL(event.destination.url);
            const pathDestination = pathname;
            const routeDestination = this.#fixRoutename(pathDestination);
            const savedParams = this.#getSavedParams(routeDestination);
            this.#navigate(routeDestination, savedParams);
        });
    }
    #fixRoutename(route){
        if(route[0] === '/')
            route = route.substring(1);
        if(route == '') 
            return '/';
        return route; 
    }
    #getCurrentUri(){
        return this.#fixRoutename(window.location.pathname);
    }
    #setDefaultPage(){
        let currentPath = this.#getCurrentUri();
        let getSavedParams = this.#getSavedParams(currentPath);
        let defaultPathComponent = this.#getPath(currentPath, getSavedParams);
        this.#stateTarget = stateOf(defaultPathComponent)
    }
    to(route_name, params){
        route_name = this.#fixRoutename(route_name);
        this.#saveParams(route_name, params);
        window.history.pushState('', '', route_name);
        // scroll to top page
        window.scroll(0, 0);
    }
    back(){
        window.history.back()
    }
    #saveParams(routename, params){
        if(params != null){
            sessionStorage.setItem(routename, JSON.stringify(params));
        }
    }
    #getSavedParams(routename){
        let data = sessionStorage.getItem(routename);
        sessionStorage.removeItem(routename);
        return JSON.parse(data);
    }
    browser(){
        return this.#stateTarget;
    }
    #getPath(routename, params){
        for (let i = 0; i < this.#routes.length; i++) {
            const route = this.#routes[i];
            
            if(route.path === routename){
                this.#saveParams(routename, params);
                return toElement(route.component, params)
            }
        }
    }
    #navigate(routename, params){
        routename = this.#fixRoutename(routename);
        let targetComponent = this.#getPath(routename, params);
        if(targetComponent)
            this.#stateTarget.value = targetComponent;
    }
    // REQUIRED
    install(context){
        this.#setDefaultPage();
        this.#initialNavigateListener();
        context[this.#varname] = this;
    }
}
function toElement(component, params = null){
    if(component instanceof JetzElement){
        return component
    }else if(component.prototype instanceof Component){
        let _component = new component();
        _component.$params = params;
        return _component.render();
    }else if(component instanceof Component){
        return component.render();
    }else if(typeof component === 'function'){
        if(params == null)
            return component();
        else
            return component(params);
    }
}

export function route(path, component){
    return {
        path: path,
        component: component
    }
}

export function link(routename, element, params = null){
    return element.on('click', e => {
        e.preventDefault();
        Jetz.$route.to(routename, params)
    })
}