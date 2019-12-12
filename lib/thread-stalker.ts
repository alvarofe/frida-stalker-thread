var ThreadsFollowed : {[id: number] : boolean} = {};

function isThreadFollowed(threadId: ThreadId) {
  return ThreadsFollowed[threadId];
}

function FollowThread(threadId:ThreadId, options:StalkerOptions) {
  if (isThreadFollowed(threadId)) {
    return;
  }

  ThreadsFollowed[threadId] = true;
  console.log("[+] Following thread " + threadId);
  Stalker.follow(threadId, options);
}

function UnfollowThread(threadId:ThreadId) {
  if (!isThreadFollowed(threadId)) {
    return;
  }

  delete ThreadsFollowed[threadId];
  console.log("[+] Unfollowing thread " + threadId);
  Stalker.unfollow(threadId);
  Stalker.garbageCollect();
}

class StalkerThread {
  constructor(options:StalkerOptions) {
    this.options = options;
  }

  Follow(threadId: ThreadId): void {
    FollowThread(threadId, this.options);
  }
  Unfollow(threadId: ThreadId) : void {
    UnfollowThread(threadId);
  }

  options:StalkerOptions;
}


function PthreadStalker(options:StalkerOptions) : StalkerThread {
  const stalker = new StalkerThread(options);
  const pthreadCreate = Module.getExportByName(null, 'pthread_create');
  Interceptor.attach(pthreadCreate, {
    onEnter(args) {
      //if who calls pthread_create is not being followed skip it
      if (!isThreadFollowed(this.threadId)) {
        return;
      }
      const functionAddress = args[2] as NativePointer;
      Interceptor.attach(functionAddress, {
        onEnter(args) {
          stalker.Follow(this.threadId);
        },
        onLeave(retVal) {
          stalker.Unfollow(this.threadId);
        }
      });
    }
  });
  return stalker;
}

export { PthreadStalker };

