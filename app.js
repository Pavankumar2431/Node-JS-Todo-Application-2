const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbpath = path.join(__dirname, 'todoApplication.db')
let db = null
const app = express()
const format = require('date-fns/format')
const isValid = require('date-fns/isValid')
const isMatch = require('date-fns/isMatch')
app.use(express.json())

const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB error: (${e.message})`)
    process.exit(1)
  }
}
initializeDBandServer()
//
const convertResponseObjtoDBobject = dbobject => {
  return {
    id: dbobject.id,
    todo: dbobject.todo,
    priority: dbobject.priority,
    status: dbobject.status,
    category: dbobject.category,
    dueDate: dbobject.due_date,
  }
}
//
app.get('/todos/', async (request, response) => {
  let getTodosQuery = ''
  const {search_q = '', status, priority, category} = request.query
  let data = null
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `SELECT
      *
    FROM
      todo 
    WHERE
       status = '${status}'
      AND priority = '${priority}';`
          data = await db.all(getTodosQuery)
          response.send(
            data.map(eachItem => convertResponseObjtoDBobject(eachItem)),
          )
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }

      break
    case hasCategoryandStatusProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category = '${category}' AND status = '${status}';`
          data = await db.all(getTodosQuery)
          response.send(
            data.map(eachitem => convertResponseObjtoDBobject(eachitem)),
          )
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasCategoryAndPriority(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          getTodosQuery = `SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}'; `
          data = await db.all(getTodosQuery)
          response.send(
            data.map(eachitem => convertResponseObjtoDBobject(eachitem)),
          )
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasPriorityProperty(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodosQuery = `SELECT
      *
    FROM
      todo 
    WHERE
      priority = '${priority}';`
        data = await db.all(getTodosQuery)
        response.send(
          data.map(eachItem => convertResponseObjtoDBobject(eachItem)),
        )
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case hasStatusProperty(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodosQuery = `SELECT
      *
    FROM
      todo 
    WHERE
   status = '${status}';`
        data = await db.all(getTodosQuery)
        response.send(
          data.map(eachItem => convertResponseObjtoDBobject(eachItem)),
        )
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case hasSearchProperty(request.query):
      getTodosQuery = `SELECT
      *
    FROM
      todo 
    WHERE
      todo LIKE '%${search_q}%';`
      data = await db.all(getTodosQuery)
      response.send(
        data.map(eachItem => convertResponseObjtoDBobject(eachItem)),
      )
      break

    case hasCategoryProperty(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getTodosQuery = `SELECT
      *
    FROM
      todo 
    WHERE
      category = '${category}';`
        data = await db.all(getTodosQuery)
        response.send(
          data.map(eachItem => convertResponseObjtoDBobject(eachItem)),
        )
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    default:
      getTodosQuery = `select * from todo;`
      data = await db.all(getTodosQuery)
      response.send(
        data.map(eachItem => convertResponseObjtoDBobject(eachItem)),
      )
  }
})
const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}
const hasCategoryandStatusProperty = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}
const hasCategoryAndPriority = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}
const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}
const hasSearchProperty = requestQuery => {
  return requestQuery.search_q !== undefined
}
const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}
//
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `SELECT * FROM todo where id = ${todoId};`
  const todoItem = await db.get(getTodoQuery)
  response.send(convertResponseObjtoDBobject(todoItem))
})
//
app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  if (isMatch(date, 'yyyy-MM-dd')) {
    const newDate = format(new Date(date), 'yyyy-MM-dd')
    const requestQuery = `select * from todo where due_date = '${newDate}';`
    const responseResult = await db.all(requestQuery)
    response.send(
      responseResult.map(eachitem => convertResponseObjtoDBobject(eachitem)),
    )
  } else {
    response.status(400)
    response.send('Invalid Due Date')
  }
})
//
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isMatch(dueDate, 'yyyy-M-dd')) {
          const postTodoDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
          const postTodoQuery = `
              INSERT INTO todo(id, todo, category, priority, status, due_date)
              VALUES (
                ${id},
                '${todo}',
                '${category}',
                '${priority}',
                '${status}',
                '${postTodoDueDate}'
              );`
          await db.run(postTodoQuery)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})
//
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `
  DELETE FROM todo WHERE id = ${todoId};`
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})
//
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const requestBody = request.body
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`
  const previousTodo = await db.get(previousTodoQuery)

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = requestBody
  let updateTodoQuery
  switch (true) {
    case requestBody.status !== undefined:
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        updateTodoQuery = `UPDATE todo SET todo = '${todo}',
       priority = '${priority}',
       status = '${status}',
       category = '${category}',
       due_date = '${dueDate}'
       WHERE id = ${todoId}; `
        await db.run(updateTodoQuery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break
    case requestBody.priority !== undefined:
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        updateTodoQuery = `UPDATE todo SET 
      todo = '${todo}',
      priority = '${priority}',
       status = '${status}',
       category = '${category}',
       due_date = '${dueDate}'
       WHERE id = ${todoId};`
        await db.run(updateTodoQuery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case requestBody.todo !== undefined:
      updateTodoQuery = `UPDATE todo SET 
      todo = '${todo}',
      priority = '${priority}',
       status = '${status}',
       category = '${category}',
       due_date = '${dueDate}'
       WHERE id = ${todoId};`
      await db.run(updateTodoQuery)
      response.send('Todo Updated')

      break

    case requestBody.category !== undefined:
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        updateTodoQuery = `UPDATE todo SET 
      todo = '${todo}',
      priority = '${priority}',
       status = '${status}',
       category = '${category}',
       due_date = '${dueDate}'
       WHERE id = ${todoId};`
        await db.run(updateTodoQuery)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, 'yyyy-MM-dd')) {
        const newDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
        updateTodoQuery = `
      UPDATE todo SET 
      todo = '${todo}',
      priority = '${priority}',
       status = '${status}',
       category = '${category}',
       due_date = '${dueDate}'
       WHERE id = ${todoId};`
        await db.run(updateTodoQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
  }
})
module.exports = app
