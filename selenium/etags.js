const ifNoneMatch = 'if-none-match';
let tracked = new Map();

function etagTrackingApp(request, response) {
  if request.headers.hasOwnProperty(ifNoneMatch) {
    let key = request.headers[ifNoneMatch];
    if tracked.has(key) {
      let count = tracked.get(key);
      tracked.set(key, count + 1);
      response.statusCode = 304
    }
  }
}
