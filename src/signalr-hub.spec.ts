import {HubConnectionBuilder} from '@microsoft/signalr';
import {combineLatest, of} from 'rxjs';
import {SignalRHub} from './signalr-hub';


describe('SignalRHub', function () {

    const connection = new HubConnectionBuilder().withUrl('http://localhost:5000/hub-name').build();
    jest.spyOn(connection, 'start').mockImplementation(() => Promise.resolve());
    const hub = new SignalRHub(connection)

    describe('stream', function () {

        const on = jest.spyOn(hub, 'on').mockImplementation(() => of('event-payload'));

        it('should be create one subject for duplicate event names', done => {

            const s1 = hub.stream<string>('test-event');
            const s2 = hub.stream<string>('TEST-EVENT');

            combineLatest([s1, s2]).subscribe(([r1, r2]) => {

                expect(on).toBeCalledTimes(2);
                expect(r1).toBe(r2)
                done();
            })

        });

    });

});