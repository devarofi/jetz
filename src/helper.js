Object.isEmpty = function(target){
    if(target){
        for (const _ in target) {
            return false;
        }
    }
    return true;
}
Object.isNotEmpty = function(target){
    return !Object.isEmpty(target);
}

export default Object;