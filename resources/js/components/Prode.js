import React, { Component } from 'react'
import Panel from './Panel'

export default class Prode extends Component {

  constructor() {
    super();
    this.state = {
      idPartido: '',
      equipos: [],
      partidos: [],
    }
  }

  siguienteEtapa = {
    cuartos: "semifinal",
    semifinal: "final"
  }

  componentDidMount() {
    this.inicializarState();
  }

  inicializarState = () => {
    var partidosEnLS = localStorage.getItem('partidos');
    fetch('/equipos')
      .then(response => {
        return response.json();
      })
      .then(equipos => {
        console.log("sarasa")
        this.setState({ idPartido: this.props.match.params.listaId || '', equipos }, () => this.inicializarPartidos(partidosEnLS));
      });
  }

  inicializarPartidos = (partidosEnLS) => {
    if (partidosEnLS && partidosEnLS.length > 2 && !this.state.idPartido) {
      var partidos = JSON.parse(partidosEnLS);
      this.setState({ partidos });
    }
    else {
      if (this.state.idPartido) {
        axios.get("/partidos/" + this.state.idPartido).then(response => {
          var partidos = response["data"];
          this.setState({ partidos });
        }).catch(error => {
          console.log("this is error", error);
        });
      }
      else {
        this.inicializarPartidosNormal();
      }
    }
  }

  inicializarPartidosNormal = () => {
    var partidos = { ...this.state.partidos };
    partidos = [];
    var equiposDup = [... this.state.equipos];
    var arregloIzquierda = equiposDup.splice(0, Math.floor(equiposDup.length / 2));
    var arregloDerecha = equiposDup;
    var partidoCuartos = arregloIzquierda.map(equipo => {
      let cuartos = {
        numero_partido: equipo.id,
        etapa: "cuartos",
        equipo1: equipo.nombre_equipo,
        equipo2: arregloDerecha[equipo.id].nombre_equipo,
        boton1: false,
        boton2: false,
        resultado1: 0,
        resultado2: 0,
      }
      partidos.push(cuartos);
    })
    //console.log("ENTRO");

    //Agregar semifinales
    var id = 4;
    for (var i = 0; i < 2; i++) {
      let semifinal = {
        numero_partido: id++,
        etapa: "semifinal",
        equipo1: "N/A",
        equipo2: "N/A",
        boton1: false,
        boton2: false,
        resultado1: 0,
        resultado2: 0,
      }
      partidos.push(semifinal);
    }

    let final = {
      numero_partido: 6,
      etapa: "final",
      equipo1: "N/A",
      equipo2: "N/A",
      boton1: false,
      boton2: false,
      resultado1: 0,
      resultado2: 0,
    }
    partidos.push(final);

    this.setState({ partidos });
  }

  componentDidUpdate() {
    if (this.state.idPartido) {
      localStorage.setItem('partidos/' + this.state.idPartido, JSON.stringify(this.state.partidos));
    }
    else {
      localStorage.setItem('partidos', JSON.stringify(this.state.partidos));
    }
  }

  actualizarPartidos = (partido) => {
    let partidos = { ...this.state.partidos };
    let partidoActualizar = { ...this.state.partidos[partido.numero_partido] }
    partidoActualizar = partido;
    partidos[partido.numero_partido] = partidoActualizar;
    this.setState({ partidos });
  }

  crearGanadoresSiguienteEtapa = (etapaActual, siguienteEtapa) => {
    var partidos = { ...this.state.partidos }
    var partidosValues = Object.values(this.state.partidos);
    partidosValues.filter(partido =>
      partido.etapa === etapaActual
    ).map(partido => {
      let idSiguienteEtapa = Math.floor(partido.numero_partido / 2) + 4;
      let equipoActualizar = "equipo" + (Math.floor(partido.numero_partido % 2) + 1);
      let partidoSiguienteEtapa = { ...partidos[idSiguienteEtapa] };
      partidoSiguienteEtapa.etapa = this.siguienteEtapa[etapaActual];
      partidoSiguienteEtapa.id = idSiguienteEtapa;
      if (partido.boton1 || (partido.resultado1 > partido.resultado2)) {
        partidoSiguienteEtapa[equipoActualizar] = partido.equipo1
      }
      else if (partido.boton2 || (partido.resultado1 < partido.resultado2)) {
        partidoSiguienteEtapa[equipoActualizar] = partido.equipo2
      }
      else {
        partidoSiguienteEtapa[equipoActualizar] = "N/A"
      }
      partidos[idSiguienteEtapa] = partidoSiguienteEtapa;
    });
    this.setState({ partidos });
  }

  guardarCambios = (e) => {
    axios.post("/partidos", this.state.partidos).then(response => {
      this.props.actualizarPartidosUsuarios();
    }).catch(error => {
      console.log("this is error", error);
    });
  }

  actualizarCambios = (e) => {
    axios.put("/partidos", this.state).then(response => {
      console.log(response);
    }).catch(error => {
      //console.log("this is error", error);
    });
  }

  componentWillMount() {
    this.unlisten = this.props.history.listen((location, action) => {
      this.inicializarState();
    });
  }

  componentWillUnmount() {
    this.unlisten();
  }

  render() {
    return (
      <div>
        <Panel etapa="cuartos" siguienteEtapa={this.siguienteEtapa["cuartos"]} equipos={this.state.equipos} partidos={this.state.partidos} actualizarPartidos={this.actualizarPartidos} crearGanadoresSiguienteEtapa={this.crearGanadoresSiguienteEtapa} />
        <Panel etapa="semifinal" siguienteEtapa={this.siguienteEtapa["semifinal"]} equipos={this.state.equipos} partidos={this.state.partidos} actualizarPartidos={this.actualizarPartidos} crearGanadoresSiguienteEtapa={this.crearGanadoresSiguienteEtapa} />
        <Panel etapa="final" siguienteEtapa="" equipos={this.state.equipos} partidos={this.state.partidos} actualizarPartidos={this.actualizarPartidos} crearGanadoresSiguienteEtapa={this.crearGanadoresSiguienteEtapa} />
        {
          this.state.idPartido ?
            <div className="col-xs-12 text-center">
              <button type="button" onClick={this.actualizarCambios} className="btn btn-primary text-center center">
                Actualizar
            </button>
            </div>
            :
            <div className="col-xs-12 text-center">
              <button type="button" onClick={this.guardarCambios} className="btn btn-primary text-center center">
                Crear
            </button>
            </div>
        }
      </div>
    )
  }
}