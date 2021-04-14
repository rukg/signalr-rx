import * as signalR from '@microsoft/signalr';
import {HubConnection} from '@microsoft/signalr';
import {combineLatest, defer, Observable, Subject} from 'rxjs';
import {map, mapTo, shareReplay} from 'rxjs/operators';

type SubjectsMap = { [key: string]: Subject<unknown> };

export class SignalrHub {

    private readonly subjects: SubjectsMap
    private readonly connection;


    start$ = defer(() => this.connection.start())
        .pipe(
            mapTo(true),
            shareReplay(1)
        );

    constructor(readonly url: string) {
        this.connection = createHub(url);
        this.subjects = {};
    }

    on<T>(eventName: string): Observable<T> {
        const subject = this.ensureEventSubject<T>(eventName);
        this.connection.on(eventName, (data: T) => subject.next(data));
        return subject.asObservable();
    }

    stream<T>(event: string): Observable<T> {
        return combineLatest([this.start$, this.on<T>(event)]).pipe(
            map(([_, value]: [boolean, T]) => value));
    }

    private ensureEventSubject<T>(eventName: string): Subject<T> {
        return (this.subjects[eventName] as Subject<T>) ??= new Subject<T>();
    }

}


export function createHub(url: string): HubConnection {
    return new signalR.HubConnectionBuilder()
        .withUrl(url)
        .build();
}
