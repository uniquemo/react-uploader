const path = require('path');
const fs = require('fs-extra');
const Koa = require('koa');
const Router = require('koa-router');
const koaBody = require('koa-body');
const koaStatic = require('koa-static');

const { PUBLIC_DIR } = require('./utils');

const app = new Koa();
const router = new Router();

const UPLOAD_DIR_PATH = path.resolve(__dirname, './uploads');

router.get(`/test`, (ctx) => {
  console.log(`123`)
  ctx.body = 123
})

router.post(`/upload/:filename/:chunkName/:start`, async (ctx, next) => {
  const { filename, chunkName } = ctx.req.params;
  console.log(`filename => `, filename)
  console.log(`chunk name => `, chunkName)
})

router.get('/verify/:filename', async (ctx) => {
  const { filename } = ctx.req.params;
  console.log(`filename 11 => `, filename)
  const filePath = path.resolve(PUBLIC_DIR, filename);
  const existFile = await fs.pathExists(filePath);

  if (existFile) {
    return {
      success: true,
      needUpload: false
    }
  }

  const tempDir = path.resolve(TEMP_DIR, filename);
  const exist = await fs.pathExists(tempDir);
  const uploadList = [];
  if (exist) {
    uploadList = await fs.readdir(tempDir);
    uploadList = await Promise.all(uploadList.map(async (filename) => {
      let stat = await fs.stat(path.resolve(tempDir, filename));
      return {
        filename,
        size: stat.size
      }
    }));
  }

  ctx.res.json({
    success: true,
    needUpload: true,
    uploadList //已经上传的文件列表
  });
});

app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  ctx.set('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');

  if (ctx.method === 'OPTIONS') {
    ctx.body = 204;
  } else {
    await next();
  }
})

app
  .use(router.routes())
  .use(router.allowedMethods());
// app.use(koaStatic(UPLOAD_DIR_PATH));

// app.use(koaBody({
//   multipart: true,
//   formidable: {
//     uploadDir: UPLOAD_DIR_PATH,
//     keepExtensions: true
//   }
// }))

// app.use(async (ctx, next) => {
//   if (ctx.request.url === '/upload') {
//     Object.keys(ctx.request.files).forEach(key => {
//       const file = ctx.request.files[key];
//       const { path } = file;
//       const splitPath = path.split('/');
//       ctx.body = {
//         url: `http://localhost:5000/${splitPath[splitPath.length - 1]}`
//       };
//     })
//   }
//   await next();
// })

app.listen(5000, (err) => {
  if (!err) {
    console.log(`Server is listening at port 5000`)
  }
})
