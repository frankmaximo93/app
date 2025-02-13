document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('measurements-form');
    const nomeInput = document.getElementById('nome');
    const pesoInput = document.getElementById('peso');
    const alturaInput = document.getElementById('altura');
    const sexoInput = document.getElementById('sexo');
    const protocoloInput = document.getElementById('protocolo');
    const dobrasCampos = document.getElementById('dobras-campos');
    const resultadosContainer = document.getElementById('resultados-container');
    const exportarPdfButton = document.getElementById('exportar-pdf');
    const exportarCsvButton = document.getElementById('exportar-csv');
    const limparCamposButton = document.getElementById('limpar-campos');

    protocoloInput.addEventListener('change', () => {
        const protocolo = protocoloInput.value;
        dobrasCampos.innerHTML = '';

        const protocolos = {
            'pollock3': ['Peitoral', 'Abdômen', 'Coxa'],
            'pollock7': ['Peitoral', 'Abdômen', 'Coxa', 'Tríceps', 'Subescapular', 'Axilar Média', 'Suprailíaca'],
            'weltman': ['Bíceps', 'Tríceps', 'Subescapular', 'Suprailíaca']
        };

        (protocolos[protocolo] || []).forEach(addDobrasCampo);
    });

    function addDobrasCampo(nome) {
        const label = document.createElement('label');
        label.textContent = `Dobra ${nome} (mm):`;
        const input = document.createElement('input');
        input.type = 'number';
        input.id = `dobra-${nome.toLowerCase()}`;
        input.required = true;
        label.appendChild(input);
        dobrasCampos.appendChild(label);
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = nomeInput.value;
        const peso = parseFloat(pesoInput.value);
        const altura = parseFloat(alturaInput.value) / 100; // Converter cm para metros
        const sexo = sexoInput.value;
        const protocolo = protocoloInput.value;

        // Calcular IMC
        const imc = (peso / (altura * altura)).toFixed(2);

        // Calcular percentual de gordura corporal baseado no protocolo
        let percentualGordura = calcularPercentualGordura(protocolo, sexo);

        // Calcular massa gorda, massa magra, massa óssea e massa residual
        const massaGorda = (peso * (percentualGordura / 100)).toFixed(2);
        const massaMagra = (peso - massaGorda).toFixed(2);
        const massaOssea = (peso * 0.15).toFixed(2); // Exemplo de cálculo de massa óssea
        const massaResidual = (peso * 0.05).toFixed(2); // Exemplo de cálculo de massa residual

        // Classificação de IMC
        let classificacaoIMC;
        if (imc < 18.5) {
            classificacaoIMC = 'Abaixo do peso &#9312;';
        } else if (imc < 24.9) {
            classificacaoIMC = 'Peso normal &#9312;';
        } else if (imc < 29.9) {
            classificacaoIMC = 'Sobrepeso &#9312;';
        } else {
            classificacaoIMC = 'Obesidade &#9312;';
        }

        // Classificação de risco cardiovascular
        let classificacaoRisco;
        if (sexo === 'M') {
            classificacaoRisco = (parseFloat(document.getElementById('abdomen').value) > 102) ? 'Ruim &#9312;' : 'Bom &#9312;';
        } else {
            classificacaoRisco = (parseFloat(document.getElementById('abdomen').value) > 88) ? 'Ruim &#9312;' : 'Bom &#9312;';
        }

        // Exibir resultados no modal
        Swal.fire({
            title: 'Resultados',
            html: `
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <div style="flex: 1;">
                        <h3>IMC</h3>
                        <p><strong style="font-size: 1.5rem;">${imc}</strong></p>
                        <p>Altura: ${alturaInput.value} m / Peso: ${pesoInput.value} kg</p>
                        <p class="classification" style="color: ${classificacaoIMC.includes('Peso normal') ? 'green' : 'orange'};">${classificacaoIMC}</p>
                    </div>
                    <div style="flex: 1;">
                        <h3>Composição Corporal</h3>
                        <p><strong style="font-size: 1.5rem;">${percentualGordura.toFixed(2)}%</strong></p>
                        <ul>
                            <li>Gordura: ${massaGorda} kg</li>
                            <li>Músculos: ${massaMagra} kg</li>
                            <li>Resíduos: ${massaResidual} kg</li>
                            <li>Ossos: ${massaOssea} kg</li>
                        </ul>
                        <canvas id="composicaoCorporalChart" width="200" height="200"></canvas>
                    </div>
                    <div style="flex: 1;">
                        <h3>Risco Cardiovascular</h3>
                        <p>Circunferência abdominal: ${document.getElementById('abdomen').value} cm</p>
                        <p class="classification" style="color: ${classificacaoRisco.includes('Ruim') ? 'red' : 'blue'};">${classificacaoRisco}</p>
                        <p class="alert" style="color: red;">Risco aumentado substancialmente &#9312;</p>
                    </div>
                </div>
            `,
            icon: 'info',
            width: 600,
            padding: '20px',
            background: '#ffffff',
            showConfirmButton: true,
            confirmButtonText: 'OK',
            confirmButtonColor: '#3085d6',
            customClass: {
                container: 'horizontal-swal',
                popup: 'no-border-radius'
            },
            didOpen: () => {
                const ctx = document.getElementById('composicaoCorporalChart').getContext('2d');
                new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: ['Gordura', 'Músculos', 'Resíduos', 'Ossos'],
                        datasets: [{
                            data: [massaGorda, massaMagra, massaResidual, massaOssea],
                            backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        return `${context.label}: ${context.raw} kg`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        });

        // Exibir resultados na página
        resultadosContainer.innerHTML = `
            <p>Nome: ${nome}</p>
            <p>IMC: ${imc}</p>
            <p>Percentual de Gordura: ${percentualGordura.toFixed(2)}%</p>
            <p>Massa Gorda: ${massaGorda} kg</p>
            <p>Massa Magra: ${massaMagra} kg</p>
            <p>Massa Óssea: ${massaOssea} kg</p>
            <p>Massa Residual: ${massaResidual} kg</p>
        `;

        // Limpar campos do formulário
        nomeInput.value = '';
        pesoInput.value = '';
        alturaInput.value = '';
        sexoInput.value = '';
        protocoloInput.value = '';
        dobrasCampos.innerHTML = '';
    });

    function calcularPercentualGordura(protocolo, sexo) {
        const dobras = Array.from(dobrasCampos.querySelectorAll('input')).map(input => parseFloat(input.value));
        const somaDobras = dobras.reduce((a, b) => a + b, 0);
        let densidadeCorporal;

        if (protocolo === 'pollock3') {
            if (sexo === 'M') {
                densidadeCorporal = 1.10938 - (0.0008267 * somaDobras) + (0.0000016 * Math.pow(somaDobras, 2)) - (0.0002574 * 30); // Exemplo de idade
            } else {
                densidadeCorporal = 1.0994921 - (0.0009929 * somaDobras) + (0.0000023 * Math.pow(somaDobras, 2)) - (0.0001392 * 30); // Exemplo de idade
            }
        } else if (protocolo === 'pollock7') {
            if (sexo === 'M') {
                densidadeCorporal = 1.112 - (0.00043499 * somaDobras) + (0.00000055 * Math.pow(somaDobras, 2)) - (0.00028826 * 30); // Exemplo de idade
            } else {
                densidadeCorporal = 1.097 - (0.00046971 * somaDobras) + (0.00000056 * Math.pow(somaDobras, 2)) - (0.00012828 * 30); // Exemplo de idade
            }
        } else if (protocolo === 'weltman') {
            if (sexo === 'M') {
                densidadeCorporal = 1.1043 - (0.001327 * somaDobras);
            } else {
                densidadeCorporal = 1.0764 - (0.000812 * somaDobras);
            }
        }

        return ((4.95 / densidadeCorporal) - 4.5) * 100;
    }

    exportarPdfButton.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Adicionar cabeçalho
        doc.setFontSize(22);
        doc.setTextColor(0, 128, 0); // Verde
        doc.text('Relatório de Composição Corporal', 105, 20, null, null, 'center');
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0); // Preto
        doc.text(`Nome: ${document.querySelector('#resultados-container p:nth-child(1)').textContent.split(': ')[1]}`, 105, 30, null, null, 'center');

        // Adicionar tabela de dados
        const tableData = [
            ['Métrica', 'Valor'],
            ['IMC', document.querySelector('#resultados-container p:nth-child(2)').textContent.split(': ')[1]],
            ['Percentual de Gordura', document.querySelector('#resultados-container p:nth-child(3)').textContent.split(': ')[1]],
            ['Massa Gorda', document.querySelector('#resultados-container p:nth-child(4)').textContent.split(': ')[1]],
            ['Massa Magra', document.querySelector('#resultados-container p:nth-child(5)').textContent.split(': ')[1]],
            ['Massa Óssea', document.querySelector('#resultados-container p:nth-child(6)').textContent.split(': ')[1]],
            ['Massa Residual', document.querySelector('#resultados-container p:nth-child(7)').textContent.split(': ')[1]]
        ];

        doc.autoTable({
            head: [tableData[0]],
            body: tableData.slice(1),
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [0, 128, 0] }, // Verde
            styles: { halign: 'center' }
        });

        // Adicionar gráfico de pizza
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        document.body.appendChild(canvas); // Append canvas to body to render it

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Massa Gorda', 'Massa Magra', 'Massa Óssea', 'Massa Residual'],
                datasets: [{
                    data: [
                        parseFloat(document.querySelector('#resultados-container p:nth-child(4)').textContent.split(': ')[1]),
                        parseFloat(document.querySelector('#resultados-container p:nth-child(5)').textContent.split(': ')[1]),
                        parseFloat(document.querySelector('#resultados-container p:nth-child(6)').textContent.split(': ')[1]),
                        parseFloat(document.querySelector('#resultados-container p:nth-child(7)').textContent.split(': ')[1])
                    ],
                    backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    position: 'bottom'
                }
            }
        });

        setTimeout(() => {
            canvas.width = 180;
            canvas.height = 180;
            const imgData = canvas.toDataURL('image/png');
            doc.addImage(imgData, 'PNG', 15, doc.autoTable.previous.finalY + 10, 180, 80);

            const nome = document.querySelector('#resultados-container p:nth-child(1)').textContent.split(': ')[1];
            doc.save(`relatorio-composicao-corporal-${nome}.pdf`);
            document.body.removeChild(canvas); // Remove canvas after rendering
        }, 1000); // Delay to ensure chart is rendered
    });

    exportarCsvButton.addEventListener('click', () => {
        const nome = document.querySelector('#resultados-container p:nth-child(1)').textContent.split(': ')[1];
        const imc = document.querySelector('#resultados-container p:nth-child(2)').textContent.split(': ')[1];
        const percentualGordura = document.querySelector('#resultados-container p:nth-child(3)').textContent.split(': ')[1];
        const massaGorda = document.querySelector('#resultados-container p:nth-child(4)').textContent.split(': ')[1];
        const massaMagra = document.querySelector('#resultados-container p:nth-child(5)').textContent.split(': ')[1];
        const massaOssea = document.querySelector('#resultados-container p:nth-child(6)').textContent.split(': ')[1];
        const massaResidual = document.querySelector('#resultados-container p:nth-child(7)').textContent.split(': ')[1];

        const csvContent = [
            ['Nome', 'IMC', 'Percentual de Gordura', 'Massa Gorda', 'Massa Magra', 'Massa Óssea', 'Massa Residual'],
            [nome, imc, percentualGordura, massaGorda, massaMagra, massaOssea, massaResidual]
        ].map(e => e.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'resultados-composicao-corporal.csv';
        link.click();
    });

    limparCamposButton.addEventListener('click', () => {
        nomeInput.value = '';
        pesoInput.value = '';
        alturaInput.value = '';
        sexoInput.value = '';
        protocoloInput.value = '';
        dobrasCampos.innerHTML = '';
        resultadosContainer.innerHTML = '';
    });
});