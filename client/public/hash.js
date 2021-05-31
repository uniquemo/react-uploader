self.importScripts('https://cdn.bootcss.com/spark-md5/3.0.0/spark-md5.js');

// File => 多个 Blob => 将 Blob 读成 ArrayBuffer => spark 计算哈希值
self.onmessage = async (event) => {
  const { partList } = event.data;
  const spark = new self.SparkMD5.ArrayBuffer();
  let percent = 0;
  const perSize = 100 / partList.length;  // 每计算完一个part，相当于完成了百分之几
  const buffers = await Promise.all(partList.map(({ chunk, size }) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(chunk);
      reader.onload = (event) => {
        percent += perSize;
        self.postMessage({ percent: Number(percent.toFixed(2)) });
        resolve(event.target.result);
      }
    })
  }))

  buffers.forEach(buffer => spark.append(buffer));
  self.postMessage({ percent: 100, hash: spark.end() });
  self.close();
}
