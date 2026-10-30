/**
 * Session-scoped key/value store backed by sessionStorage.
 * Install it with `Jetz.use(session)` to expose it as `$session`,
 * or create a standalone proxy with `sessionOf(data)`.
 */
export class JetzSession {
    session_id = 'app_session';

    dataProxy;
    savedData;

    get(key, def = null) {
        if (this.savedData != null && Object.prototype.hasOwnProperty.call(this.savedData, key))
            return this.savedData[key];
        return this[key] ?? def;
    }
    has(key) {
        return this.savedData != null && Object.prototype.hasOwnProperty.call(this.savedData, key);
    }
    set(key, value) {
        // `__proto__` would re-parent the stored object instead of storing a value
        if (key === '__proto__') return true;
        if (this.savedData == null) this.savedData = {};
        this.savedData[key] = value;
        this.save();
        return true;
    }
    setInitialData(data) {
        let oldData = null;
        try {
            oldData = sessionStorage.getItem(this.session_id);
        } catch (e) { /* storage unavailable: start from the initial data */ }
        if (oldData) {
            try {
                this.savedData = JSON.parse(oldData);
            } catch (e) {
                // corrupted stored session: fall back to initial data
                this.savedData = data;
                this.save();
            }
        } else {
            this.savedData = data;
            this.save();
        }
    }
    destroy() {
        try {
            sessionStorage.removeItem(this.session_id);
        } catch (e) { /* storage unavailable */ }
        this.savedData = {};
    }
    save() {
        try {
            sessionStorage.setItem(this.session_id, JSON.stringify(this.savedData));
        } catch (e) { /* storage unavailable or full */ }
    }

    constructor(data = {}) {
        this.setInitialData(data);
        this.dataProxy = new Proxy(this, {
            get(target, prop) {
                return target.get(prop);
            },
            set(target, prop, value) {
                return target.set(prop, value);
            }
        });
    }

    install(context) {
        context.$session = this.dataProxy;
    }
}

export function sessionOf(data) {
    return (new JetzSession(data)).dataProxy;
}