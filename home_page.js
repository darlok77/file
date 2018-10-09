module.exports.homePage = function({ csrfToken}) {

  const uploadForm = `
    <form method="post" action="/file" enctype="multipart/form-data">
      <label>File:</label>
      <input name="file" type="file"/>
      <input type="hidden" name="_csrf" value="${csrfToken}"/>
      <button>upload</submit>
    </form>
  `

  return (`
    <!doctype html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <title>Demo App</title>
    </head>
      <body>
        <h1>files upload</h1>
          <div>
            ${uploadForm}
          </div>
      </body>
    </head>`
  )
}