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

export default Obj;