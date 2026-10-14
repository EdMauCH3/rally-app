export default function TablaMarcador({ equipos }) {
  if (equipos.length === 0) {
    return <p className="text-sm text-gray-500">Aún no hay equipos creados.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-500 text-left">
            <th className="px-4 py-3">Equipo</th>
            <th className="px-4 py-3 text-right">Gymkana</th>
            <th className="px-4 py-3 text-right">Gotas</th>
            <th className="px-4 py-3 text-right">Torneo</th>
            <th className="px-4 py-3 text-right">Ajustes</th>
            <th className="px-4 py-3 text-right font-bold">Total</th>
          </tr>
        </thead>
        <tbody>
          {equipos.map((e) => (
            <tr key={e.equipo_id} className="border-t">
              <td className="px-4 py-3 font-medium text-gray-800">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full mr-2 align-middle"
                  style={{ backgroundColor: e.color_hex }}
                />
                {e.nombre}
              </td>
              <td className="px-4 py-3 text-right">{e.total_gymkana}</td>
              <td className="px-4 py-3 text-right">{e.total_tesoro}</td>
              <td className="px-4 py-3 text-right">{e.total_torneo}</td>
              <td className="px-4 py-3 text-right">{e.total_ajustes}</td>
              <td className="px-4 py-3 text-right font-bold text-gray-900">
                {e.puntos_generales}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
