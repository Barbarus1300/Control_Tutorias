// Datos de la aplicación
let alumnos = [];

// Elementos del DOM
const tablaCalificaciones = document.getElementById('tablaCalificaciones');
const fileInput = document.getElementById('fileInput');
const btnExportar = document.getElementById('btnExportar');
const btnAgregarAlumno = document.getElementById('btnAgregarAlumno');
const btnGestionMaterias = document.getElementById('btnGestionMaterias');
const modalAlumno = document.getElementById('modalAlumno');
const modalMaterias = document.getElementById('modalMaterias');
const closeModals = document.querySelectorAll('.close');
const formAlumno = document.getElementById('formAlumno');
const listaMaterias = document.getElementById('listaMaterias');
const btnAgregarMateria = document.getElementById('btnAgregarMateria');
const nuevaMateria = document.getElementById('nuevaMateria');

// Event Listeners
fileInput.addEventListener('change', importarExcel);
btnExportar.addEventListener('click', exportarExcel);
btnAgregarAlumno.addEventListener('click', () => modalAlumno.style.display = 'block');
btnGestionMaterias.addEventListener('click', mostrarMaterias);
btnAgregarMateria.addEventListener('click', agregarMateria);
formAlumno.addEventListener('submit', agregarAlumno);

// Cerrar modales
closeModals.forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
        this.closest('.modal').style.display = 'none';
    });
});

// Cerrar modales al hacer clic fuera
window.addEventListener('click', (event) => {
    if (event.target === modalAlumno) {
        modalAlumno.style.display = 'none';
    }
    if (event.target === modalMaterias) {
        modalMaterias.style.display = 'none';
    }
});

// Función para importar Excel
function importarExcel(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Procesar la primera hoja
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        alumnos = procesarDatosExcel(jsonData);
        generarVistaAlumnos(alumnos);
    };
    reader.readAsArrayBuffer(file);
}

// Procesar datos del Excel
function procesarDatosExcel(datos) {
    const alumnosProcesados = [];
    let alumnoActual = null;

    // Obtener nombres de materias del encabezado
    const encabezados = datos[0] || [];
    const nombresMaterias = encabezados.slice(2).filter(Boolean);

    datos.forEach((fila, index) => {
        // Saltar encabezados y filas vacías
        if (index === 0 || !fila || fila.length === 0) return;

        // Detectar fila de nombre de alumno
        if (typeof fila[0] === 'string' && fila[0].trim() !== '' && !fila[0].startsWith('Z')) {
            // Nuevo alumno
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
        }
        // Detectar número de control
        else if (typeof fila[0] === 'string' && fila[0].startsWith('Z')) {
            if (alumnoActual) {
                alumnoActual.control = fila[0].trim();
            }
        }
        // Detectar filas de unidades
        else if (typeof fila[1] === 'string' && ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'].includes(fila[1].trim())) {
            if (!alumnoActual) return;

            // Asignar calificaciones por unidad
            const unidad = fila[1].trim();
            alumnoActual.materias.forEach((materia, i) => {
                const calificacion = fila[i + 2];
                if (calificacion !== undefined && calificacion !== null && calificacion !== '') {
                    const valor = isNaN(calificacion) ? null : parseFloat(calificacion);
                    switch (unidad) {
                        case 'I': materia.unidadI = valor; break;
                        case 'II': materia.unidadII = valor; break;
                        case 'III': materia.unidadIII = valor; break;
                        case 'IV': materia.unidadIV = valor; break;
                        case 'V': materia.unidadV = valor; break;
                        case 'VI': materia.unidadVI = valor; break;
                        case 'VII': materia.unidadVII = valor; break;
                    }
                }
            });
        }
    });

    return alumnosProcesados;
}

// Generar vista de alumnos
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

    // Agregar event listeners para celdas editables
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

// Generar tabla de materias para un alumno
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
                            <td contenteditable="true" ${materia.unidadI !== null && materia.unidadI < 70 ? 'data-na="true"' : ''}>${formatCalificacion(materia.unidadI)}</td>
                            <td contenteditable="true" ${materia.unidadII !== null && materia.unidadII < 70 ? 'data-na="true"' : ''}>${formatCalificacion(materia.unidadII)}</td>
                            <td contenteditable="true" ${materia.unidadIII !== null && materia.unidadIII < 70 ? 'data-na="true"' : ''}>${formatCalificacion(materia.unidadIII)}</td>
                            <td contenteditable="true" ${materia.unidadIV !== null && materia.unidadIV < 70 ? 'data-na="true"' : ''}>${formatCalificacion(materia.unidadIV)}</td>
                            <td contenteditable="true" ${materia.unidadV !== null && materia.unidadV < 70 ? 'data-na="true"' : ''}>${formatCalificacion(materia.unidadV)}</td>
                            <td contenteditable="true" ${materia.unidadVI !== null && materia.unidadVI < 70 ? 'data-na="true"' : ''}>${formatCalificacion(materia.unidadVI)}</td>
                            <td contenteditable="true" ${materia.unidadVII !== null && materia.unidadVII < 70 ? 'data-na="true"' : ''}>${formatCalificacion(materia.unidadVII)}</td>
                            <td class="promedio">${promedio.toFixed(1)}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

// Formatear calificación (mostrar N/A si es menor a 70)
function formatCalificacion(cal) {
    if (cal === null || cal === undefined) return '-';
    return cal < 70 ? 'N/A' : cal;
}

// Calcular promedio de una materia (ignorando calificaciones < 70)
function calcularPromedioMateria(materia) {
    const unidades = [
        materia.unidadI,
        materia.unidadII,
        materia.unidadIII,
        materia.unidadIV,
        materia.unidadV,
        materia.unidadVI,
        materia.unidadVII
    ];

    const calificacionesValidas = unidades
        .filter(cal => cal !== null && cal !== undefined && !isNaN(cal) && cal >= 70)
        .map(cal => parseFloat(cal));

    if (calificacionesValidas.length === 0) return 0;

    const suma = calificacionesValidas.reduce((total, cal) => total + cal, 0);
    return suma / calificacionesValidas.length;
}

// Actualizar datos cuando se edita una celda
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
        
        // Validar que sea un número
        let valor = celda.textContent.trim();
        
        // Permitir N/A como valor especial
        if (valor.toUpperCase() === 'N/A') {
            valor = null;
        } else {
            // Convertir a número
            valor = valor === '' ? null : parseFloat(valor);
            
            // Validar si es un número
            if (isNaN(valor)) {
                alert('Solo se permiten números o N/A en las calificaciones');
                // Restaurar valor anterior
                const unidad = ['I','II','III','IV','V','VI','VII'][unidadIndex];
                celda.textContent = formatCalificacion(materia[`unidad${unidad}`]);
                return;
            }
            
            // Validar rango (0-100)
            if (valor !== null && (valor < 0 || valor > 100)) {
                alert('La calificación debe estar entre 0 y 100');
                const unidad = ['I','II','III','IV','V','VI','VII'][unidadIndex];
                celda.textContent = formatCalificacion(materia[`unidad${unidad}`]);
                return;
            }
        }
        
        // Actualizar la unidad correspondiente
        switch (unidadIndex) {
            case 0: materia.unidadI = valor; break;
            case 1: materia.unidadII = valor; break;
            case 2: materia.unidadIII = valor; break;
            case 3: materia.unidadIV = valor; break;
            case 4: materia.unidadV = valor; break;
            case 5: materia.unidadVI = valor; break;
            case 6: materia.unidadVII = valor; break;
        }
        
        // Actualizar promedio
        const promedio = calcularPromedioMateria(materia);
        fila.querySelector('.promedio').textContent = promedio.toFixed(1);
        
        // Formatear el valor según las reglas
        celda.textContent = formatCalificacion(valor);
        
        // Actualizar atributo data-na para estilos
        if (valor !== null && valor < 70) {
            celda.setAttribute('data-na', 'true');
        } else {
            celda.removeAttribute('data-na');
        }
    }
}

// Mostrar lista de materias
function mostrarMaterias() {
    listaMaterias.innerHTML = '';
    
    // Obtener todas las materias únicas de los alumnos
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
    
    // Event listeners para botones de eliminar
    document.querySelectorAll('.eliminar-materia').forEach(btn => {
        btn.addEventListener('click', function() {
            const nombreMateria = this.dataset.materia;
            eliminarMateria(nombreMateria);
        });
    });
    
    modalMaterias.style.display = 'block';
}

// Agregar nueva materia
function agregarMateria() {
    const nombreMateria = nuevaMateria.value.trim();
    if (!nombreMateria) {
        alert('Por favor ingrese un nombre para la materia');
        return;
    }
    
    // Verificar si la materia ya existe
    let materiaExiste = false;
    if (alumnos.length > 0) {
        materiaExiste = alumnos[0].materias.some(m => m.nombre === nombreMateria);
    }
    
    if (materiaExiste) {
        alert('Esta materia ya existe');
        return;
    }
    
    // Agregar la materia a todos los alumnos
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
    
    // Actualizar la vista
    mostrarMaterias();
    generarVistaAlumnos(alumnos);
    nuevaMateria.value = '';
}

// Eliminar materia
function eliminarMateria(nombreMateria) {
    if (confirm(`¿Estás seguro de eliminar la materia "${nombreMateria}"? Esto la quitará de todos los alumnos.`)) {
        // Eliminar la materia de todos los alumnos
        alumnos.forEach(alumno => {
            alumno.materias = alumno.materias.filter(m => m.nombre !== nombreMateria);
        });
        
        // Actualizar la vista
        mostrarMaterias();
        generarVistaAlumnos(alumnos);
    }
}

// Exportar a Excel
function exportarExcel() {
    if (alumnos.length === 0) {
        alert('No hay datos para exportar');
        return;
    }

    // Preparar datos para exportación (formato similar al Excel original)
    const datosExportar = [];
    
    // Encabezados
    const encabezados = ['NOMBRES', 'UNIDAD'];
    if (alumnos[0]?.materias) {
        alumnos[0].materias.forEach(materia => {
            encabezados.push(materia.nombre);
        });
    }
    datosExportar.push(encabezados);
    
    // Datos de alumnos
    alumnos.forEach(alumno => {
        // Fila con nombre de alumno
        datosExportar.push([alumno.nombre, '', ...Array(alumno.materias.length).fill('')]);
        
        // Fila con número de control
        datosExportar.push([alumno.control, '', ...Array(alumno.materias.length).fill('')]);
        
        // Filas por unidad
        for (let unidad of ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']) {
            const filaUnidad = ['', unidad];
            
            alumno.materias.forEach(materia => {
                const valor = materia[`unidad${unidad}`] || '';
                filaUnidad.push(valor === null ? '' : valor);
            });
            
            datosExportar.push(filaUnidad);
        }
        
        // Espacio entre alumnos
        datosExportar.push(Array(encabezados.length).fill(''));
    });
    
    // Crear libro de Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(datosExportar);
    XLSX.utils.book_append_sheet(wb, ws, "Calificaciones");
    
    // Exportar
    XLSX.writeFile(wb, "calificaciones_exportadas.xlsx");
}

// Agregar nuevo alumno
function agregarAlumno(event) {
    event.preventDefault();
    
    const nombre = document.getElementById('nombre').value.trim();
    const control = document.getElementById('control').value.trim();
    
    if (!nombre || !control) {
        alert('Por favor complete todos los campos');
        return;
    }
    
    const nuevoAlumno = {
        nombre,
        control,
        materias: []
    };
    
    // Si hay alumnos existentes, copiar la estructura de materias
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
    
    // Limpiar formulario y cerrar modal
    formAlumno.reset();
    modalAlumno.style.display = 'none';
}

// Eliminar automáticamente el guión al enfocar
document.addEventListener('focusin', (event) => {
    if (event.target.hasAttribute('contenteditable')) {
        if (event.target.textContent.trim() === '-') {
            event.target.textContent = '';
        }
    }
});

// Inicializar la aplicación sin datos de ejemplo
document.addEventListener('DOMContentLoaded', () => {
    alumnos = [];
    generarVistaAlumnos(alumnos);
});