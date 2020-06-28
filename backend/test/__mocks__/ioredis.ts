class Redis {
    private values: any = {}
    public constructorParams: any
    public calls: Array<any> = []

    constructor(options?: any) {
        this.constructorParams = options
    }

    async set(key: string, value: any) {
        this.calls.push(['set', key, value])
        this.values[key] = value
    }

    async exists(key: string): Promise<boolean> {
        this.calls.push(['exists', key])
        return this.values.hasOwnProperty(key)
    }

    async get(key: string): Promise<any> {
        this.calls.push(['get', key])
        if (!this.exists(key)) {
            throw new Error('No such key')
        }
        return this.values[key]
    }

    async disconnect() {
        this.calls.push(['disconnect'])
    }

    async quit() {
        this.calls.push(['quit'])
    }

    async connect() {
        this.calls.push(['connect'])
    }
}

export default Redis
