const path = require('path');
const Koa = require('koa');
const koaBody = require('koa-body');
const koaStatic = require('koa-static');

const app = new Koa();

const UPLOAD_DIR_PATH = path.resolve(__dirname, './uploads');

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

app.use(koaStatic(UPLOAD_DIR_PATH))

app.use(koaBody({
  multipart: true,
  formidable: {
    uploadDir: UPLOAD_DIR_PATH,
    keepExtensions: true
  }
}))

app.use(async (ctx, next) => {
  if (ctx.request.url === '/upload') {
    Object.keys(ctx.request.files).forEach(key => {
      const file = ctx.request.files[key];
      const { path } = file;
      const splitPath = path.split('/');
      ctx.body = {
        url: `http://localhost:5000/${splitPath[splitPath.length - 1]}`
      };
    })
  }
  await next();
})

app.listen(5000, (err) => {
  if (!err) {
    console.log(`Server is listening at port 5000`)
  }
})
