import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API;

function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");

  useEffect(() => {
    fetch(`${API}/todos`)
      .then((res) => res.json())
      .then(setTodos);
  }, []);

  const addTodo = async () => {
    const res = await fetch(`${API}/todos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const newTodo = await res.json();
    setTodos([...todos, newTodo]);
    setTitle("");
  };

  const deleteTodo = async (id) => {
    await fetch(`${API}/todos/${id}`, { method: "DELETE" });
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">TODO-List</h1>
      <div className="flex items-center mb-4">
        <input
          className="flex-1 px-4 py-2 border rounded-md focus:outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New todo"
        />
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md ml-2 cursor-pointer"
          onClick={addTodo}
        >
          Add
        </button>
      </div>
      <ul className="list-disc pl-8">
        {todos.map((todo) => (
          <li key={todo.id} className="mb-2">
            {todo.title}
            <button
              className="text-red-500 hover:text-red-700 ml-2 cursor-pointer"
              onClick={() => deleteTodo(todo.id)} 
            >
              ❌
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
