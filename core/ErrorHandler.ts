// ErrorHandler 拥有两个功能：
// 通过链式调用，处理函数执行之后出现的错误以及正常返回的数据
// 当发生错误的时候，阻塞后续的处理函数执行，显示错误信息，并将错误信息添加到日志中

class ErrorHandler{
    fn : Function;
    errFn : Function;
    successFn : Function;

    constructor(fn: Function){
        this.fn = fn;
    }

    static create(fn: Function){
        return new ErrorHandler(fn);
    }

    onErr(errFn: Function){
        this.errFn = errFn;
        return this;
    }

    onOk(successFn: Function){
        this.successFn = successFn;
        return this;
    }

    exec(...args: any[]){
        try{
            const result = this.fn(...args);
            this.successFn?.(result);
            return result;
        }catch(e){
            console.error(e);
            if (this.errFn)
                return this.errFn?.(e);
        }
        return null;
    }
}

export default ErrorHandler;