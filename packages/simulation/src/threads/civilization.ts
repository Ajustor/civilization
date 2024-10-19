declare const self: Worker

self.onmessage = (event: MessageEvent) => {
  console.log(event.data)

}