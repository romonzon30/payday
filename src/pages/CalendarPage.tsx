import { useEffect, useState } from "react";
import styles from "./CalendarPage.module.css";

const API_URL = "https://payday-w8er.onrender.com";

type DueDate = {
  _id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  status: string;
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dueDates, setDueDates] = useState<DueDate[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    fetchDueDates();
  }, []);

  async function fetchDueDates() {
  const res = await fetch(`${API_URL}/api/due-dates`, {
    headers: {
      Authorization: localStorage.getItem("token") || "",
    },
  });

  const data = await res.json();
  setDueDates(data);
  }

  async function addDueDate(e: React.FormEvent) {
    e.preventDefault();

  const res = await fetch(`${API_URL}/api/due-dates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token") || "",
    },
    body: JSON.stringify({
      title,
      description,
      category,
      date,
    }),
  });

    if (res.ok) {
      setTitle("");
      setDescription("");
      setCategory("");
      setDate("");
      setShowForm(false);
      fetchDueDates();
    }
  }

  async function deleteDueDate(id: string) {
   await fetch(`${API_URL}/api/due-dates/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: localStorage.getItem("token") || "",
    },
  });

    fetchDueDates();
  }

  function previousMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

  const calendarDays = [];

  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const monthDueDates = dueDates.filter((item) => {
    const itemDate = new Date(item.date);
    return itemDate.getMonth() === month && itemDate.getFullYear() === year;
  });

  function getDueDatesForDay(day: number) {
    return dueDates.filter((item) => {
      const itemDate = new Date(item.date);
      return (
        itemDate.getDate() === day &&
        itemDate.getMonth() === month &&
        itemDate.getFullYear() === year
      );
    });
  }

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <div>
          <h1>Calendario Fiscal</h1>
          <p>Administrá tus obligaciones tributarias y vencimientos.</p>
        </div>

        <button className={styles.addButton} onClick={() => setShowForm(true)}>
          + Agregar Vencimiento
        </button>
      </section>

      {showForm && (
        <form className={styles.form} onSubmit={addDueDate}>
          <h2>Nuevo vencimiento</h2>

          <input
            type="text"
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Categoría"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Descripción"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <div className={styles.formActions}>
            <button type="button" onClick={() => setShowForm(false)}>
              Cancelar
            </button>

            <button type="submit">Guardar</button>
          </div>
        </form>
      )}

      <section className={styles.content}>
        <div className={styles.calendarBox}>
          <div className={styles.calendarHeader}>
            <h2>{monthName}</h2>

            <div>
              <button onClick={previousMonth}>‹</button>
              <button onClick={nextMonth}>›</button>
            </div>
          </div>

          <div className={styles.weekDays}>
            <span>LUN</span>
            <span>MAR</span>
            <span>MIÉ</span>
            <span>JUE</span>
            <span>VIE</span>
            <span>SÁB</span>
            <span>DOM</span>
          </div>

          <div className={styles.grid}>
            {calendarDays.map((day, index) => (
              <div className={styles.day} key={index}>
                {day && (
                  <>
                    <span className={styles.dayNumber}>{day}</span>

                    {getDueDatesForDay(day).map((item) => (
                      <div className={styles.event} key={item._id}>
                        {item.title}
                      </div>
                    ))}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <aside className={styles.sidebar}>
          <h2>Vencimientos del Mes</h2>

          {monthDueDates.length === 0 && (
            <p className={styles.empty}>No hay vencimientos este mes.</p>
          )}

          {monthDueDates.map((item) => (
            <div className={styles.card} key={item._id}>
              <div>
                <span className={styles.category}>{item.category}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <small>{new Date(item.date).toLocaleDateString("es-AR")}</small>
              </div>

              <button onClick={() => deleteDueDate(item._id)}>Eliminar</button>
            </div>
          ))}
        </aside>
      </section>
    </main>
  );
}