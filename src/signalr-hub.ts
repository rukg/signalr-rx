import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { from, Observable, Subject } from 'rxjs';

type Protocol = 'http' | 'https';
type ConnectionString = `${Protocol}${string}`;
type SubjectsMap = { [key: string]: Subject<unknown> };

export class SignalRHub {
    private readonly subjects: SubjectsMap = {};

    constructor(private readonly connection: HubConnection) {}

    public connect(): Observable<void> {
        return from(this.connection.start());
    }

    public on<T>(event: string): Observable<T> {
        const subject = this.ensureEventSubject<T>(event);
        this.connection.on(event, (data: T) => subject.next(data));
        return subject.asObservable();
    }

    public off(event: string): void {
        const subject = this.subjects[event];

        if (subject) {
            this.connection.off(event);
            subject.complete();

            delete this.subjects[event];
        }
    }

    public dispose(): void {
        for (let key in this.subjects) {
            this.off(key);
        }
    }

    private ensureEventSubject<T>(event: string): Subject<T> {
        this.subjects[event] = this.subjects[event] || new Subject<T>();
        return this.subjects[event] as Subject<T>;
    }
}

export function createDefaultConnection(url: ConnectionString): HubConnection {
    return new HubConnectionBuilder()
        .withUrl(url)
        .withAutomaticReconnect()
        .build();
}
