export default function Tab({ day, selectedDay, setSelectedDay }) {
    return (
        <button
            key={day.id}
            onClick={() => setSelectedDay(day.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${selectedDay === day.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
        >
            {day.name}
        </button>
    )
}