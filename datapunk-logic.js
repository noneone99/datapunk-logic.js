// Arquivo de lógica da Rede Neural - Hospedar no GitHub (Raw)
return function(propsRef) {
    return function(p) {
        let nos = []
        let conexoes = []
        let anguloX = 0
        let anguloY = 0
        let velocidadeAtual = 0.005 
        let tempoOrbitaRoot = 0
        let noHovered = null
        let escalaGlobal = 1

        p.setup = () => {
            p.createCanvas(100, 100); // Tamanho inicial temporário
            p.textFont("monospace")
        }

        p.draw = () => {
            const props = propsRef.current || {}
            
            // Permite fundo transparente para mostrar o Grid do React por baixo
            if (props.backgroundColor === 'transparent') {
                p.clear();
            } else {
                p.background(props.backgroundColor || '#000000');
            }
            
            p.translate(p.width / 2, p.height / 2)

            noHovered = null
            let mouseCentroX = p.mouseX - p.width / 2
            let mouseCentroY = p.mouseY - p.height / 2

            for (let n of nos) {
                if (n.alpha > 0.05 && n.projX !== undefined) {
                    let tamanhoBase = n.tipo === "central" ? 30 : n.tipo === "principal" ? 20 : 14
                    let tamanhoEscalado = tamanhoBase * n.tamanhoMult * escalaGlobal

                    if (p.dist(mouseCentroX, mouseCentroY, n.projX, n.projY) < tamanhoEscalado) {
                        noHovered = n
                    }
                }
            }

            let bSpeed = props.baseSpeed !== undefined ? props.baseSpeed : 0.005
            let velocidadeAlvo = noHovered ? bSpeed * 0.04 : bSpeed
            velocidadeAtual = p.lerp(velocidadeAtual, velocidadeAlvo, 0.1)
            anguloY -= velocidadeAtual

            tempoOrbitaRoot -= velocidadeAtual * 3
            nos[0].alvoX = p.cos(tempoOrbitaRoot) * 120
            nos[0].alvoZ = p.sin(tempoOrbitaRoot) * 120
            nos[0].alvoY = p.sin(tempoOrbitaRoot * 0.5) * 40

            let tempoNoise = p.frameCount * 0.005

            for (let n of nos) {
                n.alpha = p.lerp(n.alpha, n.alvoAlpha, 0.08)
                n.tamanhoMult = p.lerp(n.tamanhoMult, n.alvoTamanhoMult, 0.1)

                let noiseX = p.map(p.noise(n.id * 10, tempoNoise), 0, 1, -40, 40)
                let noiseY = p.map(p.noise(n.id * 20, tempoNoise), 0, 1, -40, 40)
                let noiseZ = p.map(p.noise(n.id * 30, tempoNoise), 0, 1, -40, 40)

                let destinoX = n.alvoX
                let destinoY = n.alvoY
                let destinoZ = n.alvoZ
                if (n.pai !== null && n.alvoAlpha < 0.3) {
                    let paiNode = nos[n.pai]
                    destinoX = paiNode.atualX
                    destinoY = paiNode.atualY
                    destinoZ = paiNode.atualZ
                }

                n.atualX = p.lerp(n.atualX, destinoX, 0.08)
                n.atualY = p.lerp(n.atualY, destinoY, 0.08)
                n.atualZ = p.lerp(n.atualZ, destinoZ, 0.08)

                let proj = projetar3D(n.atualX + noiseX, n.atualY + noiseY, n.atualZ + noiseZ, anguloX, anguloY)
                n.projX = proj.x * escalaGlobal
                n.projY = proj.y * escalaGlobal
            }

            for (let c of conexoes) {
                let noA = nos[c.a]
                let noB = nos[c.b]

                let alphaLinha = p.min(noA.alpha, noB.alpha)
                if (alphaLinha > 0.05) {
                    p.strokeWeight(c.tipo === "especial" ? 2 * escalaGlobal : 1.5 * escalaGlobal)

                    // Mapeia as cores para as props do Framer
                    let corCentral = props.rootColor || '#FF0000'
                    let corSub = props.subColor || '#0000FF'
                    let corInter = props.interColor || '#FFA500'

                    if (c.tipo === "especial") {
                        p.stroke(corInter) // Laranja Sólido
                    } else {
                        if (noA.tipo === "central" || noB.tipo === "central") {
                            p.stroke(corCentral) // Vermelho Sólido
                        } else {
                            p.stroke(corSub) // Azul Sólido
                        }
                    }
                    
                    p.line(noA.projX, noA.projY, noB.projX, noB.projY)
                }
            }

            p.textAlign(p.CENTER, p.CENTER)

            for (let n of nos) {
                if (n.alpha > 0.05) {
                    p.noStroke()
                    let tamanhoBase

                    // Mapeia as cores sólidas das propriedades do Framer (ou usa as originais como fallback)
                    let corCentral = props.rootColor || '#FF0000'
                    let corPrincipal = props.principalColor || '#7FFF00'
                    let corSub = props.subColor || '#0000FF'
                    let corInter = props.interColor || '#FFA500'

                    if (n.tipo === "central") { p.fill(corCentral); tamanhoBase = 24 } 
                    else if (n.tipo === "principal") { p.fill(corPrincipal); tamanhoBase = 16 } 
                    else if (n.tipo === "sub") { p.fill(corSub); tamanhoBase = 10 } 
                    else if (n.tipo === "interconexao") { p.fill(corInter); tamanhoBase = 12 }

                    let tamanhoFinal = tamanhoBase * n.tamanhoMult * escalaGlobal

                    // 4º PASSO: Desenhar Caracteres "∎" Sólidos
                    p.textSize(tamanhoFinal * 1.5)
                    p.text("∎", n.projX, n.projY)

                    // ==========================================
                    // 5º PASSO: ETIQUETAS HUD RESPONSIVAS
                    // ==========================================
                    n.div.show()

                    let divX = n.projX + (p.width / 2) + (tamanhoFinal / 2) + 12
                    let divY = n.projY + (p.height / 2) - 10
                    n.div.position(divX, divY)
                    n.div.style("transform", "translate(0, 0)") // Remove o translate de antes

                    let baseTexto = ""
                    let bgCor = ""
                    let textoCor = ""

                    // CORES SÓLIDAS DAS ETIQUETAS
                    if (n.tipo === "central") { baseTexto = "ROOT"; bgCor = corCentral; textoCor = '#FFF' } 
                    else if (n.tipo === "principal") { baseTexto = "SUB"; bgCor = corPrincipal; textoCor = '#000' } 
                    else if (n.tipo === "sub") { baseTexto = "INTER SUB"; bgCor = corSub; textoCor = '#FFF' } 
                    else if (n.tipo === "interconexao") { baseTexto = "INTERCONEXÃO"; bgCor = corInter; textoCor = '#000' }

                    let conteudoHTML = `<span style="color: ${textoCor};">${baseTexto}</span>`

                    if (noHovered === n) {
                        let textoExtra = ""
                        if (n.tipo === "central") textoExtra = " GENESIS"
                        else if (n.tipo === "principal") textoExtra = " SS-TM"
                        else if (n.tipo === "sub") textoExtra = " TX-HASH"
                        else if (n.tipo === "interconexao") textoExtra = " BRIDGED"

                        conteudoHTML += `<span style="color: #FFFFFF;"> | ${textoExtra}</span>`
                    }

                    n.div.html(conteudoHTML)
                    n.div.style("background", bgCor)
                    n.div.style("border", "none") // Tira a borda inventada antes
                } else {
                    n.div.hide()
                }
            }

            if (noHovered) p.cursor(p.HAND)
            else p.cursor(p.ARROW)
        }

        p.mousePressed = () => {
            if (noHovered && noHovered.tipo === "principal") {
                noHovered.expandido = !noHovered.expandido
                noHovered.alvoTamanhoMult = noHovered.expandido ? 3.0 : 1.0
                noHovered.alvoAlpha = 1.0

                for (let sub of nos) {
                    if (sub.pai === noHovered.id) {
                        sub.alvoAlpha = noHovered.expandido ? 1.0 : 0
                    }
                }
            }
        }

        p.mouseDragged = () => {
            anguloY -= (p.mouseX - p.pmouseX) * 0.01
            anguloX += (p.mouseY - p.pmouseY) * 0.01
        }

        p.touchMoved = () => {
            anguloY -= (p.mouseX - p.pmouseX) * 0.01
            anguloX += (p.mouseY - p.pmouseY) * 0.01
            return false
        }

        p.customInit = (container, w, h) => {
            p.resizeCanvas(w, h)
            
            if (nos.length === 0) {
                nos.push(new No(0, 0, 0, 0, "central", true, null))
                nos.push(new No(1, -240, 160, 100, "principal", true, 0))
                nos.push(new No(2, 240, 160, -100, "principal", true, 0))
                nos.push(new No(3, 0, -240, 160, "principal", true, 0))
                nos.push(new No(4, -360, 300, 160, "sub", false, 1))
                nos.push(new No(5, -400, 100, 20, "sub", false, 1))
                nos.push(new No(6, -200, 360, 240, "sub", false, 1))
                nos.push(new No(7, 360, 300, -160, "interconexao", false, 2))
                nos.push(new No(8, 400, 100, -20, "sub", false, 2))
                nos.push(new No(9, 200, 360, -240, "sub", false, 2))
                nos.push(new No(10, 160, -400, 300, "interconexao", false, 3))
                nos.push(new No(11, -160, -400, 200, "sub", false, 3))
                nos.push(new No(12, 0, -440, 360, "sub", false, 3))

                for (let n of nos) {
                    if (n.pai !== null) {
                        let pai = nos[n.pai]
                        if (n.alvoAlpha === 0) {
                            n.atualX = pai.alvoX
                            n.atualY = pai.alvoY
                            n.atualZ = pai.alvoZ
                        }
                    }

                    n.div = p.createDiv("")
                    n.div.parent(container)
                    n.div.style("position", "absolute")
                    n.div.style("padding", "4px 8px")
                    n.div.style("font-family", "monospace")
                    n.div.style("font-weight", "bold")
                    n.div.style("font-size", "12px")
                    n.div.style("pointer-events", "none")
                    n.div.style("border-radius", "0px")
                    n.div.style("text-transform", "uppercase")
                    n.div.style("white-space", "nowrap")
                    n.div.style("z-index", "10")
                    n.div.hide()
                }

                conectar(0, 1, "normal"); conectar(0, 2, "normal"); conectar(0, 3, "normal")
                conectar(1, 4, "normal"); conectar(1, 5, "normal"); conectar(1, 6, "normal")
                conectar(2, 7, "normal"); conectar(2, 8, "normal"); conectar(2, 9, "normal")
                conectar(3, 10, "normal"); conectar(3, 11, "normal"); conectar(3, 12, "normal")
                conectar(1, 7, "especial"); conectar(1, 10, "especial")
            }

            const props = propsRef.current || {}
            let sm = props.scaleMultiplier !== undefined ? props.scaleMultiplier : 1.0
            escalaGlobal = p.min(w, h) / 1000
            escalaGlobal = p.constrain(escalaGlobal * sm, 0.4, 1.2)
        }

        p.customResize = (w, h) => {
            p.resizeCanvas(w, h)
            const props = propsRef.current || {}
            let sm = props.scaleMultiplier !== undefined ? props.scaleMultiplier : 1.0
            escalaGlobal = p.min(w, h) / 1000
            escalaGlobal = p.constrain(escalaGlobal * sm, 0.4, 1.2)
        }
        
        // ===============================================
        // MÉTODOS DE AÇÃO GLOBAL (EXPORTADOS PARA REACT)
        // ===============================================
        p.customExpandAll = () => {
            for (let n of nos) {
                if (n.tipo === "principal") {
                    n.expandido = true
                    n.alvoTamanhoMult = 3.0
                    n.alvoAlpha = 1.0
                }
                if (n.pai !== null) {
                    n.alvoAlpha = 1.0
                }
            }
        }

        p.customCollapseAll = () => {
            for (let n of nos) {
                if (n.tipo === "principal") {
                    n.expandido = false
                    n.alvoTamanhoMult = 1.0
                }
                if (n.pai !== null) {
                    n.alvoAlpha = 0.0
                }
            }
        }

        p.customResetOrbit = () => {
            tempoOrbitaRoot = 0
            anguloX = 0
            anguloY = 0
        }

        function projetar3D(x, y, z, angX, angY) {
            let x1 = x * p.cos(angY) - z * p.sin(angY)
            let z1 = x * p.sin(angY) + z * p.cos(angY)
            let y2 = y * p.cos(angX) - z1 * p.sin(angX)
            let z2 = y * p.sin(angX) + z1 * p.cos(angX)
            return { x: x1, y: y2, z: z2 }
        }

        class No {
            constructor(id, x, y, z, tipo, visivel, pai) {
                this.id = id
                this.alvoX = x; this.alvoY = y; this.alvoZ = z
                this.atualX = x; this.atualY = y; this.atualZ = z
                this.projX = 0; this.projY = 0
                this.tipo = tipo
                this.pai = pai
                this.expandido = false
                this.alvoAlpha = visivel ? 1.0 : 0
                this.alpha = visivel ? 1.0 : 0
                this.alvoTamanhoMult = 1.0
                this.tamanhoMult = 1.0
                this.div = null
            }
        }

        function conectar(idA, idB, tipo) {
            conexoes.push({ a: idA, b: idB, tipo: tipo })
        }
    }
}
