const Obj = {
    isEmpty: function(target){
        if(target){
            for (const _ in target) {
                return false;
            }
        }
        return true;
    },
    isNotEmpty: function(target){
        return !Obj.isEmpty(target);
    }
}
/** 
 * @param {Array} arr
 */
const maxFlat = 3;
export function flatMap(arr){
    return arr.flat(maxFlat);
}
export function css(value){
    return { class: value };
}
export function addScript(src, options = {}){
    document.addEventListener('DOMContentLoaded', e => {
        e.preventDefault();
        const script = document.createElement('script');
        script.setAttribute('src', src);
        document.body.append(script);
    });
}

export default Obj;