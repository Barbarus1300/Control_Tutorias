// Datos de la aplicación
let alumnos = [];

// Elementos del DOM
const tablaCalificaciones = document.getElementById('tablaCalificaciones');
const fileInput = document.getElementById('fileInput');
const btnExportar = document.getElementById('btnExportar');
const btnAgregarAlumno = document.getElementById('btnAgregarAlumno');
const btnGestionMaterias = document.getElementById('btnGestionMaterias');
const btnEstadisticas = document.getElementById('btnEstadisticas');
const modalAlumno = document.getElementById('modalAlumno');
const modalMaterias = document.getElementById('modalMaterias');
const modalEstadisticas = document.getElementById('modalEstadisticas');
const closeModals = document.querySelectorAll('.close');
const formAlumno = document.getElementById('formAlumno');
const listaMaterias = document.getElementById('listaMaterias');
const btnAgregarMateria = document.getElementById('btnAgregarMateria');
const nuevaMateria = document.getElementById('nuevaMateria');
const contenidoEstadisticas = document.getElementById('contenidoEstadisticas');

// Event Listeners
fileInput.addEventListener('change', importarExcel);
btnExportar.addEventListener('click', exportarExcel);
btnAgregarAlumno.addEventListener('click', () => modalAlumno.style.display = 'block');
btnGestionMaterias.addEventListener('click', mostrarMaterias);
btnAgregarMateria.addEventListener('click', agregarMateria);
formAlumno.addEventListener('submit', agregarAlumno);
btnEstadisticas.addEventListener('click', () => {
    mostrarEstadisticas();
    modalEstadisticas.style.display = 'block';
});

// Cerrar modales
closeModals.forEach(closeBtn => {
    closeBtn.addEventListener('click', function () {
        this.closest('.modal').style.display = 'none';
    });
});

// Cerrar modales al hacer clic fuera
window.addEventListener('click', (event) => {
    if (event.target === modalAlumno) modalAlumno.style.display = 'none';
    if (event.target === modalMaterias) modalMaterias.style.display = 'none';
    if (event.target === modalEstadisticas) modalEstadisticas.style.display = 'none';
});

// Función para importar Excel
function importarExcel(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        alumnos = procesarDatosExcel(jsonData);
        generarVistaAlumnos(alumnos);
    };
    reader.readAsArrayBuffer(file);
}

function procesarDatosExcel(datos) {
    const alumnosProcesados = [];
    let alumnoActual = null;
    const encabezados = datos[0] || [];
    const nombresMaterias = encabezados.slice(2).filter(Boolean);

    datos.forEach((fila, index) => {
        if (index === 0 || !fila || fila.length === 0) return;

        if (typeof fila[0] === 'string' && fila[0].trim() !== '' && !fila[0].startsWith('Z')) {
            alumnoActual = {
                nombre: fila[0].trim(),
                control: '',
                materias: nombresMaterias.map(nombre => ({
                    nombre: nombre.trim(),
                    unidadI: null,
                    unidadII: null,
                    unidadIII: null,
                    unidadIV: null,
                    unidadV: null,
                    unidadVI: null,
                    unidadVII: null
                }))
            };
            alumnosProcesados.push(alumnoActual);
        } else if (typeof fila[0] === 'string' && fila[0].startsWith('Z')) {
            if (alumnoActual) alumnoActual.control = fila[0].trim();
        } else if (typeof fila[1] === 'string' && ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'].includes(fila[1].trim())) {
            if (!alumnoActual) return;
            const unidad = fila[1].trim();
            alumnoActual.materias.forEach((materia, i) => {
                const calificacion = fila[i + 2];
                const valor = isNaN(calificacion) ? null : parseFloat(calificacion);
                if (valor !== null) materia[`unidad${unidad}`] = valor;
            });
        }
    });

    return alumnosProcesados;
}

function generarVistaAlumnos(alumnosData) {
    tablaCalificaciones.innerHTML = '';

    if (alumnosData.length === 0) {
        tablaCalificaciones.innerHTML = '<p>No hay alumnos registrados</p>';
        return;
    }

    alumnosData.forEach(alumno => {
        const alumnoDiv = document.createElement('div');
        alumnoDiv.className = 'alumno-card';
        alumnoDiv.innerHTML = `
            <div class="alumno-header">
                <h3>${alumno.nombre}</h3>
                <span class="control">No. Control: ${alumno.control}</span>
            </div>
            <div class="table-container">
                ${generarTablaMaterias(alumno.materias)}
            </div>
        `;
        tablaCalificaciones.appendChild(alumnoDiv);
    });

    document.querySelectorAll('[contenteditable="true"]').forEach(celda => {
        celda.addEventListener('blur', actualizarDatos);
        celda.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                celda.blur();
            }
        });
    });
}

function generarTablaMaterias(materias) {
    if (!materias || materias.length === 0) return '<p>No hay materias registradas</p>';

    return `
        <table class="materias-table">
            <thead>
                <tr>
                    <th>Materia</th>
                    <th>I</th>
                    <th>II</th>
                    <th>III</th>
                    <th>IV</th>
                    <th>V</th>
                    <th>VI</th>
                    <th>VII</th>
                    <th>Promedio</th>
                </tr>
            </thead>
            <tbody>
                ${materias.map(materia => {
                    const promedio = calcularPromedioMateria(materia);
                    return `
                        <tr>
                            <td>${materia.nombre}</td>
                            ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'].map((unidad, i) => {
                                const valor = materia[`unidad${unidad}`];
                                const text = formatCalificacion(valor);
                                const flag = valor !== null && valor < 70 ? 'data-na="true"' : '';
                                return `<td contenteditable="true" ${flag}>${text}</td>`;
                            }).join('')}
                            <td class="promedio">${promedio.toFixed(1)}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function formatCalificacion(cal) {
    if (cal === null || cal === undefined) return '-';
    return cal < 70 ? 'N/A' : cal;
}

function calcularPromedioMateria(materia) {
    const unidades = ['unidadI', 'unidadII', 'unidadIII', 'unidadIV', 'unidadV', 'unidadVI', 'unidadVII'];
    const calificaciones = unidades
        .map(unidad => materia[unidad])
        .filter(cal => cal !== null && cal >= 70);
    if (calificaciones.length === 0) return 0;
    return calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length;
}

function actualizarDatos(event) {
    const celda = event.target;
    const fila = celda.parentElement;
    const tabla = fila.parentElement.parentElement;
    const alumnoDiv = tabla.closest('.alumno-card');
    const alumnoIndex = Array.from(document.querySelectorAll('.alumno-card')).indexOf(alumnoDiv);
    const materiaIndex = Array.from(fila.parentElement.children).indexOf(fila);
    const unidadIndex = Array.from(fila.children).indexOf(celda) - 1;

    if (alumnoIndex >= 0 && materiaIndex >= 0 && unidadIndex >= 0) {
        const alumno = alumnos[alumnoIndex];
        const materia = alumno.materias[materiaIndex];
        let valor = celda.textContent.trim();

        if (valor.toUpperCase() === 'N/A') {
            valor = null;
        } else {
            valor = parseFloat(valor);
            if (isNaN(valor) || valor < 0 || valor > 100) {
                alert('Ingrese un número válido (0-100) o N/A');
                const unidad = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][unidadIndex];
                celda.textContent = formatCalificacion(materia[`unidad${unidad}`]);
                return;
            }
        }

        const unidad = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][unidadIndex];
        materia[`unidad${unidad}`] = valor;

        const promedio = calcularPromedioMateria(materia);
        fila.querySelector('.promedio').textContent = promedio.toFixed(1);
        celda.textContent = formatCalificacion(valor);

        if (valor !== null && valor < 70) {
            celda.setAttribute('data-na', 'true');
        } else {
            celda.removeAttribute('data-na');
        }
    }
}

function mostrarMaterias() {
    listaMaterias.innerHTML = '';
    const materiasUnicas = [];
    alumnos.forEach(alumno => {
        alumno.materias.forEach(materia => {
            if (!materiasUnicas.includes(materia.nombre)) {
                materiasUnicas.push(materia.nombre);
            }
        });
    });

    if (materiasUnicas.length === 0) {
        listaMaterias.innerHTML = '<p>No hay materias registradas</p>';
        modalMaterias.style.display = 'block';
        return;
    }

    materiasUnicas.forEach(materia => {
        const item = document.createElement('div');
        item.className = 'materia-item';
        item.innerHTML = `
            <span>${materia}</span>
            <button class="eliminar-materia" data-materia="${materia}">Eliminar</button>
        `;
        listaMaterias.appendChild(item);
    });

    document.querySelectorAll('.eliminar-materia').forEach(btn => {
        btn.addEventListener('click', function () {
            const nombreMateria = this.dataset.materia;
            eliminarMateria(nombreMateria);
        });
    });

    modalMaterias.style.display = 'block';
}

function agregarMateria() {
    const nombreMateria = nuevaMateria.value.trim();
    if (!nombreMateria) {
        alert('Ingrese un nombre de materia');
        return;
    }

    if (alumnos.length > 0 && alumnos[0].materias.some(m => m.nombre === nombreMateria)) {
        alert('Esta materia ya existe');
        return;
    }

    alumnos.forEach(alumno => {
        alumno.materias.push({
            nombre: nombreMateria,
            unidadI: null,
            unidadII: null,
            unidadIII: null,
            unidadIV: null,
            unidadV: null,
            unidadVI: null,
            unidadVII: null
        });
    });

    mostrarMaterias();
    generarVistaAlumnos(alumnos);
    nuevaMateria.value = '';
}

function eliminarMateria(nombreMateria) {
    if (confirm(`¿Eliminar la materia "${nombreMateria}" de todos los alumnos?`)) {
        alumnos.forEach(alumno => {
            alumno.materias = alumno.materias.filter(m => m.nombre !== nombreMateria);
        });
        mostrarMaterias();
        generarVistaAlumnos(alumnos);
    }
}

function exportarExcel() {
    if (alumnos.length === 0) {
        alert('No hay datos para exportar');
        return;
    }

    const datosExportar = [];
    const encabezados = ['NOMBRES', 'UNIDAD'];
    if (alumnos[0]?.materias) {
        alumnos[0].materias.forEach(materia => {
            encabezados.push(materia.nombre);
        });
    }
    datosExportar.push(encabezados);

    alumnos.forEach(alumno => {
        datosExportar.push([alumno.nombre, '', ...Array(alumno.materias.length).fill('')]);
        datosExportar.push([alumno.control, '', ...Array(alumno.materias.length).fill('')]);

        for (let unidad of ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']) {
            const filaUnidad = ['', unidad];
            alumno.materias.forEach(materia => {
                const valor = materia[`unidad${unidad}`];
                filaUnidad.push(valor === null ? '' : valor);
            });
            datosExportar.push(filaUnidad);
        }
        datosExportar.push(Array(encabezados.length).fill(''));
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(datosExportar);
    XLSX.utils.book_append_sheet(wb, ws, "Calificaciones");
    XLSX.writeFile(wb, "calificaciones_exportadas.xlsx");
}

function agregarAlumno(event) {
    event.preventDefault();
    const nombre = document.getElementById('nombre').value.trim();
    const control = document.getElementById('control').value.trim();
    if (!nombre || !control) {
        alert('Complete todos los campos');
        return;
    }

    const nuevoAlumno = {
        nombre,
        control,
        materias: []
    };

    if (alumnos.length > 0 && alumnos[0].materias) {
        nuevoAlumno.materias = alumnos[0].materias.map(materia => ({
            nombre: materia.nombre,
            unidadI: null,
            unidadII: null,
            unidadIII: null,
            unidadIV: null,
            unidadV: null,
            unidadVI: null,
            unidadVII: null
        }));
    }

    alumnos.push(nuevoAlumno);
    generarVistaAlumnos(alumnos);
    formAlumno.reset();
    modalAlumno.style.display = 'none';
}

document.addEventListener('focusin', (event) => {
    if (event.target.hasAttribute('contenteditable')) {
        if (event.target.textContent.trim() === '-') {
            event.target.textContent = '';
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    alumnos = [];
    generarVistaAlumnos(alumnos);
});

// 🔹 Mostrar estadísticas con detalles por unidad y filtro por alumno
function mostrarEstadisticas() {
    if (alumnos.length === 0) {
        contenidoEstadisticas.innerHTML = '<p>No hay datos para mostrar.</p>';
        return;
    }

    // Generar filtros dinámicos
    const materias = obtenerMateriasUnicas();
    const alumnosLista = alumnos.map(a => a.nombre);

    const html = `
        <h3>Filtrar Estadísticas</h3>
        <div class="filtros">
            <label>Materia:
                <select id="filtroMateria">
                    <option value="">Todas</option>
                    ${materias.map(m => `<option value="${m}">${m}</option>`).join('')}
                </select>
            </label>
            <label>Unidad:
                <select id="filtroUnidad">
                    <option value="">Todas</option>
                    <option value="I">I</option>
                    <option value="II">II</option>
                    <option value="III">III</option>
                    <option value="IV">IV</option>
                    <option value="V">V</option>
                    <option value="VI">VI</option>
                    <option value="VII">VII</option>
                </select>
            </label>
            <label>Alumno:
                <select id="filtroAlumno">
                    <option value="">Todos</option>
                    ${alumnosLista.map(nombre => `<option value="${nombre}">${nombre}</option>`).join('')}
                </select>
            </label>
            <button id="btnAplicarFiltros">Aplicar Filtros</button>
        </div>
        <div id="resultadoEstadisticas"></div>
    `;

    contenidoEstadisticas.innerHTML = html;

    document.getElementById('btnAplicarFiltros').addEventListener('click', aplicarFiltrosEstadisticas);
}

function obtenerMateriasUnicas() {
    const materiasSet = new Set();
    alumnos.forEach(alumno => {
        alumno.materias.forEach(materia => materiasSet.add(materia.nombre));
    });
    return Array.from(materiasSet);
}

function aplicarFiltrosEstadisticas() {
    const materiaSeleccionada = document.getElementById('filtroMateria').value;
    const unidadSeleccionada = document.getElementById('filtroUnidad').value;
    const alumnoSeleccionado = document.getElementById('filtroAlumno').value;

    let total = 0, reprobados = 0, desercion = 0, sumatoria = 0;

    alumnos.forEach(alumno => {
        if (alumnoSeleccionado && alumno.nombre !== alumnoSeleccionado) return;

        alumno.materias.forEach(materia => {
            if (materiaSeleccionada && materia.nombre !== materiaSeleccionada) return;

            if (unidadSeleccionada) {
                const cal = materia[`unidad${unidadSeleccionada}`];
                if (cal === null || cal === undefined || cal === '') {
                    desercion++;
                } else {
                    total++;
                    sumatoria += cal;
                    if (cal < 70) reprobados++;
                }
            } else {
                const promedio = calcularPromedioMateria(materia);
                sumatoria += promedio;
                total++;
                if (promedio < 70) reprobados++;
            }
        });
    });

    const promedio = total > 0 ? (sumatoria / total) : 0;
    const porcentajeReprobados = total > 0 ? (reprobados / total) * 100 : 0;
    const totalIntentos = total + desercion;
    const porcentajeDesercion = totalIntentos > 0 ? (desercion / totalIntentos) * 100 : 0;

    document.getElementById('resultadoEstadisticas').innerHTML = `
        <h4>Resultados:</h4>
        <table class="materias-table">
            <thead>
                <tr>
                    <th>Total Evaluados</th>
                    <th>Promedio</th>
                    <th>Reprobados</th>
                    <th>% Reprobados</th>
                    <th>Deserción</th>
                    <th>% Deserción</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${total}</td>
                    <td>${promedio.toFixed(1)}</td>
                    <td>${reprobados}</td>
                    <td>${porcentajeReprobados.toFixed(1)}%</td>
                    <td>${desercion}</td>
                    <td>${porcentajeDesercion.toFixed(1)}%</td>
                </tr>
            </tbody>
        </table>
    `;
}
