Simple module to handle better thread creations when stalking - this only works on arm64 due to  https://github.com/frida/frida-gum/commit/82a033066a868e015780c792d77819d54badc4a9. Thanks to that commit, when frida spawn a new thread the child stop being stalked, otherwise it would be stomping on parent's internal state. Therefore, this module intercept `pthread_create` to detect when new threads are created to stalk them only if the parent was being stalked.

```ts
import {PthreadStalker} from "frida-stalker-thread";

const pthreadStalker = PthreadStalker({
  events : {
    call: true
  },
  onReceive(rawEvents) {
    const events = Stalker.parse(rawEvents, {annotate: false}) as StalkerCallEventBare[];
    events.forEach(ev => {
      const location = ev[0] as NativePointer;
      const target = ev[1] as NativePointer;
      if (map.has(location) && map.has(target)) {
      	...
      }
    });
  }
});

function InterceptAndStalk(addr: NativePointer) {
  Interceptor.attach(addr, {
    onEnter(args) {
      pthreadStalker.Follow(this.threadId);
    }
  });
}

InterceptAndStalk(base.add(0x...));

```
