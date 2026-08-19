import React, { useEffect, useState } from "react";
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

export default function App() {
  const SENHA_ACESSO = "radar2026";

  const escolasPorMunicipio = {
    "CAARAPÓ": ["EE ARCÊNIO ROJAS","EE FREI JOÃO DAMASCENO","EE PADRE JOSÉ DE ANCHIETA","EE PROF. JOAQUIM ALFREDO SOARES VIANNA","EE PROFª. CLEUZA APARECIDA V. GALHARDO","EE TEN. AVIADOR ANTÔNIO JOÃO","EE INDÍGENA DE EM YVY POTY"],
    "DEODÁPOLIS": ["EE 13 DE MAIO","EE JOÃO BAPTISTA PEREIRA","EE LAGOA BONITA","EE PORTO VILMA","EE SCILA MÉDICI"],
    "DOURADINA": ["EE BARÃO DO RIO BRANCO"],
    "DOURADOS": ["CEEJA DOURADOS","CENTRO ESTADUAL DE EDUCAÇÃO PROFISSIONAL","EE ABIGAIL BORRALHO","EE ANTÔNIA DA SILVEIRA CAPILÉ","EE ANTÔNIO VICENTE AZAMBUJA","EE CASTRO ALVES","EE FLORIANO VIEGAS MACHADO","EE JOAQUIM VAZ DE OLIVEIRA","EE MARIA DA GLÓRIA MUZZI FERREIRA","EE MENODORA FIALHO DE FIGUEIREDO","EE MIN. JOÃO PAULO DOS REIS VELOSO","EE PASTOR DANIEL BERG","EE PRES. GETÚLIO VARGAS","EE PRES. TANCREDO NEVES","EE PRESIDENTE VARGAS","EE PROF. ALÍCIO ARAÚJO","EE PROF. CELSO MÜLLER DO AMARAL","EE PROFª. FLORIANA LOPES","EE PROFESSOR JOSÉ PEREIRA LINS","EE RAMONA DA SILVA PEDROSO","EE RITA ANGELINA BARBOSA SILVEIRA","EE VEREADOR MOACIR DJALMA BARROS","EE VILMAR VIEIRA MATOS","EE INDÍGENA INTERCULTURAL GUATEKA - MARÇAL DE SOUZA"],
    "FÁTIMA DO SUL": ["EE JONAS BELARMINO DA SILVA","EE SEN. FILINTO MÜLLER","EE VICENTE PALLOTTI","EE VILA BRASIL"],
    "GLÓRIA DE DOURADOS": ["EE PROFª. EUFROSINA PINTO","EE PROFª. VÂNIA MEDEIROS LOPES","EE WEIMAR TORRES"],
    "ITAPORÃ": ["EE ANTÔNIO JOÃO RIBEIRO","EE EDSON BEZERRA","EE OLIVIA PAULA","EE PRINCESA IZABEL","EE RODRIGUES ALVES","EE SEN. SALDANHA DERZI"],
    "JATEÍ": ["EE PROF. JOAQUIM ALFREDO SOARES VIANNA","EE PROFª. BERNADETE SANTOS LEITE"],
    "LAGUNA CARAPÃ": ["EE ÁLVARO MARTINS DOS SANTOS"],
    "MARACAJU": ["EE CAMBARAI","EE CEL. LIMA DE FIGUEIREDO","EE MANOEL FERREIRA DE LIMA","EE PADRE CONSTANTINO DE MONTE"],
    "RIO BRILHANTE": ["EE ETALÍVIO PEREIRA MARTINS","EE FERNANDO CORRÊA DA COSTA","EE PROFª. LIGIA TEREZINHA MARTINS"],
    "VICENTINA": ["EE EMANNUEL PINHEIRO","EE PADRE JOSÉ DANIEL","EE SÃO JOSÉ"]
  };

  const formLimpo = {
    municipio: "", escola: "", classificacaoEscola: "", data: "", diretor: "", adjunto: "",
    demandas: [], descricaoDemandas: "", administrativas: [], descricaoAdministrativas: "",
    avaliacaoSedDiretor: "", avaliacaoSedAdjunto: "", avaliacaoGovernoDiretor: "", avaliacaoGovernoAdjunto: "",
    interesseAgendaDiretor: "", interesseAgendaAdjunto: "", classificacaoDiretor: "", classificacaoAdjunto: "",
    observacoesDiretor: "", observacoesAdjunto: ""
  };

  const demandasOpcoes = ["Reforma","Pintura","Climatização","Rede elétrica","Mobiliário","Tecnologia","Segurança","Transporte","Outros"];
  const administrativasOpcoes = ["Déficit de servidores","Problemas organizacionais","Dificuldades pedagógicas","Necessidade de apoio da CRE","Outros"];
  const percepcaoOpcoes = ["Positivo","Positivo com ressalvas","Negativo"];

  // MÓDULO: CENÁRIO POLÍTICO — SIMULAÇÃO
  // Base extraída das duas listas enviadas (Estadual e Federal).
  // Cada registro preserva: deputado, município, escola, cargo, nome e telefone.
  const apoiosPoliticosBase = [
  {
    "tipo": "Estadual",
    "deputado": "André Puccineli",
    "cidade": "GLÓRIA DE DOURADOS",
    "escola": "EE Weimar Torres",
    "cargo": "Diretor",
    "nome": "Eliane Milane e Silva Rodrigues",
    "telefone": "(67) 9.9663-6459"
  },
  {
    "tipo": "Estadual",
    "deputado": "André Puccineli",
    "cidade": "VICENTINA",
    "escola": "EE São José",
    "cargo": "Diretor",
    "nome": "Claudia Regina de O. e Silva Souza",
    "telefone": "(67) 9.9643-4014"
  },
  {
    "tipo": "Estadual",
    "deputado": "Caravina",
    "cidade": "GLÓRIA DE DOURADOS",
    "escola": "EE Prof.ª Vânia Medeiros Lopes",
    "cargo": "Diretor",
    "nome": "Maria Eliete dos Santos de Matos",
    "telefone": "(67) 9.9920-4943"
  },
  {
    "tipo": "Estadual",
    "deputado": "Hélio Peluffo",
    "cidade": "MARACAJU",
    "escola": "EE Cambarai",
    "cargo": "Diretor",
    "nome": "Katiane Silva de Souza",
    "telefone": "(67) 9.8422-4228"
  },
  {
    "tipo": "Estadual",
    "deputado": "Junior Mochi",
    "cidade": "DOURADOS",
    "escola": "EE Vilmar Vieira Matos",
    "cargo": "Diretor",
    "nome": "Ivan Ferreira Pereira",
    "telefone": "(67) 9.9657-1131"
  },
  {
    "tipo": "Estadual",
    "deputado": "Lia Nogueira",
    "cidade": "DOURADINA",
    "escola": "EE Barão do Rio Branco",
    "cargo": "Adjunto",
    "nome": "Natalia Santos Oliveira",
    "telefone": "(67) 9.9978-9532"
  },
  {
    "tipo": "Estadual",
    "deputado": "Lia Nogueira",
    "cidade": "DOURADINA",
    "escola": "EE Barão do Rio Branco",
    "cargo": "Diretor",
    "nome": "Janaina Spessoto Sais",
    "telefone": "(67) 9.9988-5457"
  },
  {
    "tipo": "Estadual",
    "deputado": "Lia Nogueira",
    "cidade": "DOURADOS",
    "escola": "EE Antônia da Silveira Capilé",
    "cargo": "Adjunto",
    "nome": "Elaine Costa Guimarães",
    "telefone": "(67) 9.9971-1755"
  },
  {
    "tipo": "Estadual",
    "deputado": "Lia Nogueira",
    "cidade": "DOURADOS",
    "escola": "EE Antônia da Silveira Capilé",
    "cargo": "Diretor",
    "nome": "João  Henrique B. de Godoy Filho",
    "telefone": "(67) 9.9935-1566"
  },
  {
    "tipo": "Estadual",
    "deputado": "Lia Nogueira",
    "cidade": "DOURADOS",
    "escola": "EE Floriano Viegas  Machado",
    "cargo": "Adjunto",
    "nome": "Karla Granja Guimaraes Kupfer",
    "telefone": "(67) 9245-2822"
  },
  {
    "tipo": "Estadual",
    "deputado": "Lia Nogueira",
    "cidade": "DOURADOS",
    "escola": "EE Joaquim Vaz de Oliveira",
    "cargo": "Adjunto",
    "nome": "Kely Leal da Silva Palerno",
    "telefone": "(67) 99953-1645"
  },
  {
    "tipo": "Estadual",
    "deputado": "Lia Nogueira",
    "cidade": "DOURADOS",
    "escola": "EE Maria da Glória Muzzi  Ferreira",
    "cargo": "Diretor",
    "nome": "Pascolalino  Cornelia Angelico",
    "telefone": "(67) 9920-0963"
  },
  {
    "tipo": "Estadual",
    "deputado": "Lia Nogueira",
    "cidade": "DOURADOS",
    "escola": "EE Presidente Getulio Vargas",
    "cargo": "Diretor",
    "nome": "José Antônio do Nascimento Junior",
    "telefone": "(67) 9.9914-7374"
  },
  {
    "tipo": "Estadual",
    "deputado": "Lia Nogueira",
    "cidade": "DOURADOS",
    "escola": "EE Prof. Celso Müller do Amaral",
    "cargo": "Adjunto",
    "nome": "Elma Aparecida  Gonçalves",
    "telefone": "(67) 9.9914-5863"
  },
  {
    "tipo": "Estadual",
    "deputado": "Lia Nogueira",
    "cidade": "DOURADOS",
    "escola": "EE Prof. Celso Müller do Amaral",
    "cargo": "Diretor",
    "nome": "Wagner José de Souza",
    "telefone": "(67) 9.9227-6172"
  },
  {
    "tipo": "Estadual",
    "deputado": "Lia Nogueira",
    "cidade": "DOURADOS",
    "escola": "EE Rita Angelina Barbosa Silveira",
    "cargo": "Adjunto",
    "nome": "Peres Antonio Mello de Souza",
    "telefone": "(67) 9.9615-6760"
  },
  {
    "tipo": "Estadual",
    "deputado": "Lia Nogueira",
    "cidade": "DOURADOS",
    "escola": "EE Rita Angelina Barbosa Silveira",
    "cargo": "Diretor",
    "nome": "Tarsila Bibiane Lima Ramos",
    "telefone": "(67) 9.9617-5195"
  },
  {
    "tipo": "Estadual",
    "deputado": "Londres Machado",
    "cidade": "CAARAPÓ",
    "escola": "EE Prof. Joaquim Alfredo Soares Vianna",
    "cargo": "Diretor",
    "nome": "Luis Carlos de Andrade",
    "telefone": "(67) 9.9870-6396"
  },
  {
    "tipo": "Estadual",
    "deputado": "Londres Machado",
    "cidade": "FÁTIMA DO SUL",
    "escola": "EE Jonas Belarmino da Silva",
    "cargo": "Adjunto",
    "nome": "Edilene de Fátima Lima",
    "telefone": "*"
  },
  {
    "tipo": "Estadual",
    "deputado": "Londres Machado",
    "cidade": "FÁTIMA DO SUL",
    "escola": "EE Jonas Belarmino da Silva",
    "cargo": "Diretor",
    "nome": "Sidnei Ferreira Rocha",
    "telefone": "(67) 9.9644-7540"
  },
  {
    "tipo": "Estadual",
    "deputado": "Londres Machado",
    "cidade": "FÁTIMA DO SUL",
    "escola": "EE Senador Filinto Müller",
    "cargo": "Adjunto",
    "nome": "Leonardo de David Muhamed Zahra",
    "telefone": "(67) 9.9996-9994"
  },
  {
    "tipo": "Estadual",
    "deputado": "Londres Machado",
    "cidade": "FÁTIMA DO SUL",
    "escola": "EE Senador Filinto Müller",
    "cargo": "Diretor",
    "nome": "Altair Vieira de Albuquerque",
    "telefone": "(67) 9.9974-1718"
  },
  {
    "tipo": "Estadual",
    "deputado": "Londres Machado",
    "cidade": "FÁTIMA DO SUL",
    "escola": "EE Vicente Pallotti",
    "cargo": "Adjunto",
    "nome": "Luiz Eduardo Vieira Pereira",
    "telefone": "(67) 9.9832-7712"
  },
  {
    "tipo": "Estadual",
    "deputado": "Londres Machado",
    "cidade": "FÁTIMA DO SUL",
    "escola": "EE Vicente Pallotti",
    "cargo": "Diretor",
    "nome": "Gislaine Cristina dos Santos N. Rocha",
    "telefone": "(67) 9.9808-1825"
  },
  {
    "tipo": "Estadual",
    "deputado": "Londres Machado",
    "cidade": "FÁTIMA DO SUL",
    "escola": "EE Vila Brasil",
    "cargo": "Adjunto",
    "nome": "Rozani Moraes de Lima Reis",
    "telefone": "(67) 9.9987-2704"
  },
  {
    "tipo": "Estadual",
    "deputado": "Londres Machado",
    "cidade": "FÁTIMA DO SUL",
    "escola": "EE Vila Brasil",
    "cargo": "Diretor",
    "nome": "Caique Bento Casotti",
    "telefone": "(67)9.9631-7097"
  },
  {
    "tipo": "Estadual",
    "deputado": "Londres Machado",
    "cidade": "GLÓRIA DE DOURADOS",
    "escola": "EE Prof.ª Eufrosina Pinto",
    "cargo": "Diretor",
    "nome": "Marcio Renato Gomes",
    "telefone": "(67) 9.9963-4896"
  },
  {
    "tipo": "Estadual",
    "deputado": "Londres Machado",
    "cidade": "VICENTINA",
    "escola": "EE Emannuel Pinheiro",
    "cargo": "Diretor",
    "nome": "Maria Divaldete Mello de Almeida",
    "telefone": "(67) 9.9642-8295"
  },
  {
    "tipo": "Estadual",
    "deputado": "Londres Machado",
    "cidade": "VICENTINA",
    "escola": "EE Padre José Daniel",
    "cargo": "Adjunto",
    "nome": "Maria do Socorro Alves B. Cardoso",
    "telefone": "(67) 9.9925-1625"
  },
  {
    "tipo": "Estadual",
    "deputado": "Londres Machado",
    "cidade": "VICENTINA",
    "escola": "EE Padre José Daniel",
    "cargo": "Diretor",
    "nome": "José André de Alcantara",
    "telefone": "(67) 9.921-3657"
  },
  {
    "tipo": "Estadual",
    "deputado": "Marcelo Miranda",
    "cidade": "CAARAPÓ",
    "escola": "EE Arcênio Rojas",
    "cargo": "Diretor",
    "nome": "Solon Rodrigues Lima",
    "telefone": "(67)9.9876- 8613"
  },
  {
    "tipo": "Estadual",
    "deputado": "Marcelo Miranda",
    "cidade": "CAARAPÓ",
    "escola": "EE Indígena EM “Yvy Poty”.",
    "cargo": "Adjunto",
    "nome": "Cristiani da Silva Rocha",
    "telefone": "(67)9.9840-3698"
  },
  {
    "tipo": "Estadual",
    "deputado": "Marcelo Miranda",
    "cidade": "CAARAPÓ",
    "escola": "EE Indígena EM “Yvy Poty”.",
    "cargo": "Diretor",
    "nome": "Valdinei Marques  Mendonça",
    "telefone": "(67)9.9642-9814"
  },
  {
    "tipo": "Estadual",
    "deputado": "Marcelo Miranda",
    "cidade": "CAARAPÓ",
    "escola": "EE Prof.ª Cleuza Aparecida V. Galhardo",
    "cargo": "Adjunto",
    "nome": "Andréa Menegatti Recalde",
    "telefone": "(67)9.9876-7630"
  },
  {
    "tipo": "Estadual",
    "deputado": "Marcelo Miranda",
    "cidade": "CAARAPÓ",
    "escola": "EE Prof.ª Cleuza Aparecida V. Galhardo",
    "cargo": "Diretor",
    "nome": "Nilza Elena Zambão",
    "telefone": "(67) 9.9912 4658"
  },
  {
    "tipo": "Estadual",
    "deputado": "Marcelo Miranda",
    "cidade": "DOURADOS",
    "escola": "EE Maria da Glória Muzzi  Ferreira",
    "cargo": "Adjunto",
    "nome": "Alessandro Bezerra de Oliveira",
    "telefone": "(67) 9.9960-2551"
  },
  {
    "tipo": "Estadual",
    "deputado": "Marcelo Miranda",
    "cidade": "DOURADOS",
    "escola": "EE Presidente Tancredo Neves",
    "cargo": "Adjunto",
    "nome": "Christiane dos Santos F. Oliveira",
    "telefone": "(67)9. 9695-5682"
  },
  {
    "tipo": "Estadual",
    "deputado": "Marcelo Miranda",
    "cidade": "DOURADOS",
    "escola": "EE Presidente Vargas",
    "cargo": "Adjunto",
    "nome": "Rodrigo Lima Amaro",
    "telefone": "(67) 9.8472-4518"
  },
  {
    "tipo": "Estadual",
    "deputado": "Marcelo Miranda",
    "cidade": "DOURADOS",
    "escola": "EE Presidente Vargas",
    "cargo": "Diretor",
    "nome": "Fernando Fernandes Rodrigues",
    "telefone": "(67) 9.9651-6327"
  },
  {
    "tipo": "Estadual",
    "deputado": "Marcelo Miranda",
    "cidade": "MARACAJU",
    "escola": "EE Manoel Ferreira de Lima",
    "cargo": "Adjunto",
    "nome": "Paula Fernanda de M. Francisco",
    "telefone": "(67) 9.9111-6756"
  },
  {
    "tipo": "Estadual",
    "deputado": "Marcelo Miranda",
    "cidade": "MARACAJU",
    "escola": "EE Manoel Ferreira de Lima",
    "cargo": "Diretor",
    "nome": "Erenil Martins Cardoso",
    "telefone": "(67) 9.8418-4251"
  },
  {
    "tipo": "Estadual",
    "deputado": "Marcelo Miranda",
    "cidade": "RIO BRILHANTE",
    "escola": "EE Fernando Corrêa da Costa",
    "cargo": "Adjunto",
    "nome": "Marcus Vinicius da Costa",
    "telefone": "(67) 9690-0319"
  },
  {
    "tipo": "Estadual",
    "deputado": "Marcelo Miranda",
    "cidade": "RIO BRILHANTE",
    "escola": "EE Fernando Corrêa da Costa",
    "cargo": "Diretor",
    "nome": "Mario Cesar Furlan",
    "telefone": "(67) 9.9978-4215"
  },
  {
    "tipo": "Estadual",
    "deputado": "Marcelo Miranda",
    "cidade": "RIO BRILHANTE",
    "escola": "EE Profª. Ligia Terezinha Martins",
    "cargo": "Adjunto",
    "nome": "Elton Tagara Mareco",
    "telefone": "(67)99659-9971"
  },
  {
    "tipo": "Estadual",
    "deputado": "Marcelo Miranda",
    "cidade": "RIO BRILHANTE",
    "escola": "EE Profª. Ligia Terezinha Martins",
    "cargo": "Diretor",
    "nome": "Lucimara Faustino Barbosa Cattani",
    "telefone": "(67) 9.9973-4348"
  },
  {
    "tipo": "Estadual",
    "deputado": "Pedrossian Neto",
    "cidade": "DOURADOS",
    "escola": "EE Floriano Viegas  Machado",
    "cargo": "Diretor",
    "nome": "Julio Cezar dos Santos",
    "telefone": "(67) 9601-1845"
  },
  {
    "tipo": "Estadual",
    "deputado": "Pedrossian Neto",
    "cidade": "DOURADOS",
    "escola": "EE Prof. Alício Araújo",
    "cargo": "Adjunto",
    "nome": "Adriano Cosma Cabreira",
    "telefone": "(67) 9.9637-1770"
  },
  {
    "tipo": "Estadual",
    "deputado": "Pedrossian Neto",
    "cidade": "DOURADOS",
    "escola": "EE Prof. Alício Araújo",
    "cargo": "Diretor",
    "nome": "Marcos Falco de Lima",
    "telefone": "(67) 9.9987 1805"
  },
  {
    "tipo": "Estadual",
    "deputado": "Pedrossian Neto",
    "cidade": "DOURADOS",
    "escola": "EE Vereador Moacir Djalma Barros",
    "cargo": "Adjunto",
    "nome": "Daniel Stockamann",
    "telefone": "(67) 9.9943-8695"
  },
  {
    "tipo": "Estadual",
    "deputado": "Pedrossian Neto",
    "cidade": "MARACAJU",
    "escola": "EE Cambarai",
    "cargo": "Adjunto",
    "nome": "Géllys Luckas da Silva Agostini",
    "telefone": "(67) 9.890-4140"
  },
  {
    "tipo": "Estadual",
    "deputado": "Pedrossian Neto",
    "cidade": "MARACAJU",
    "escola": "EE Cívico-Militar Coronel  Lima de Figueiredo",
    "cargo": "Adjunto",
    "nome": "Elias Antonio Alves Sobrinho",
    "telefone": "(67)9.9626-5565"
  },
  {
    "tipo": "Estadual",
    "deputado": "Pedrossian Neto",
    "cidade": "MARACAJU",
    "escola": "EE Cívico-Militar Coronel  Lima de Figueiredo",
    "cargo": "Diretor",
    "nome": "Cleber Vanderlei Pinto Colpo",
    "telefone": "(67) 9.9941-3873"
  },
  {
    "tipo": "Estadual",
    "deputado": "Pedrossian Neto",
    "cidade": "MARACAJU",
    "escola": "EE Pe. Constantino de Monte",
    "cargo": "Adjunto",
    "nome": "Sheila Moreira Matos Dias",
    "telefone": "(67) 9.9253-2948"
  },
  {
    "tipo": "Estadual",
    "deputado": "Pedrossian Neto",
    "cidade": "MARACAJU",
    "escola": "EE Pe. Constantino de Monte",
    "cargo": "Diretor",
    "nome": "Arlon Cossetin Branco",
    "telefone": "(67) 9.9636-9692"
  },
  {
    "tipo": "Estadual",
    "deputado": "Renato Câmara",
    "cidade": "CAARAPÓ",
    "escola": "EE Frei João Damasceno",
    "cargo": "Adjunto",
    "nome": "Fernanda Venacio da Silva",
    "telefone": "(67) 9.9930-2701"
  },
  {
    "tipo": "Estadual",
    "deputado": "Renato Câmara",
    "cidade": "CAARAPÓ",
    "escola": "EE Frei João Damasceno",
    "cargo": "Diretor",
    "nome": "Nei Geller",
    "telefone": "(67)9.927-2396"
  },
  {
    "tipo": "Estadual",
    "deputado": "Renato Câmara",
    "cidade": "CAARAPÓ",
    "escola": "EE Padre José de Anchieta",
    "cargo": "Diretor",
    "nome": "Eduardo Bonfa",
    "telefone": "(67)99921-9887"
  },
  {
    "tipo": "Estadual",
    "deputado": "Renato Câmara",
    "cidade": "DEODÁPOLIS",
    "escola": "EE 13 de Maio",
    "cargo": "Diretor",
    "nome": "Vagna Dias  de Azevedo  Lourenço",
    "telefone": "(67) 9.9337-3468"
  },
  {
    "tipo": "Estadual",
    "deputado": "Renato Câmara",
    "cidade": "DEODÁPOLIS",
    "escola": "EE João Baptista Pereira",
    "cargo": "Diretor",
    "nome": "Jean Carlos da Silva",
    "telefone": "(67) 9.9987-1905"
  },
  {
    "tipo": "Estadual",
    "deputado": "Renato Câmara",
    "cidade": "DEODÁPOLIS",
    "escola": "EE Porto Vilma",
    "cargo": "Adjunto",
    "nome": "Edna Martins",
    "telefone": "(67) 9.9819-4237"
  },
  {
    "tipo": "Estadual",
    "deputado": "Renato Câmara",
    "cidade": "DEODÁPOLIS",
    "escola": "EE Porto Vilma",
    "cargo": "Diretor",
    "nome": "Givaldo Santos Oliveira",
    "telefone": "(67) 9.9681-9470"
  },
  {
    "tipo": "Estadual",
    "deputado": "Renato Câmara",
    "cidade": "DEODÁPOLIS",
    "escola": "EE Scila Médici",
    "cargo": "Adjunto",
    "nome": "Josane Marcelino Pacheco",
    "telefone": "(67) 9.9606-4111"
  },
  {
    "tipo": "Estadual",
    "deputado": "Renato Câmara",
    "cidade": "DEODÁPOLIS",
    "escola": "EE Scila Médici",
    "cargo": "Diretor",
    "nome": "Evandro Sérgio de Souza Goncales",
    "telefone": "(67) 9.9901-1977"
  },
  {
    "tipo": "Estadual",
    "deputado": "Renato Câmara",
    "cidade": "DOURADOS",
    "escola": "EE Abigail Borralho",
    "cargo": "Diretor",
    "nome": "Ramao Agedo Vieira",
    "telefone": "(67) 9.9832-2754"
  },
  {
    "tipo": "Estadual",
    "deputado": "Renato Câmara",
    "cidade": "DOURADOS",
    "escola": "EE Indígena de EM Intercultural Guateka – Marçal de Souza",
    "cargo": "Diretor",
    "nome": "Luiz de Souza Freire Junior",
    "telefone": "(67) 9.9861-1414"
  },
  {
    "tipo": "Estadual",
    "deputado": "Renato Câmara",
    "cidade": "DOURADOS",
    "escola": "EE Min. João Paulo dos Reis Veloso",
    "cargo": "Adjunto",
    "nome": "Lincoln Christian Fernandes",
    "telefone": "(67) 9.9991-6024"
  },
  {
    "tipo": "Estadual",
    "deputado": "Renato Câmara",
    "cidade": "DOURADOS",
    "escola": "EE Min. João Paulo dos Reis Veloso",
    "cargo": "Diretor",
    "nome": "José Carlos Severiano de Souza",
    "telefone": "(67) 9.9257-3603"
  },
  {
    "tipo": "Estadual",
    "deputado": "Renato Câmara",
    "cidade": "GLÓRIA DE DOURADOS",
    "escola": "EE Prof.ª Eufrosina Pinto",
    "cargo": "Adjunto",
    "nome": "keli Tatiene Rodrigues de Sá",
    "telefone": "(67) 9.9826-7878"
  },
  {
    "tipo": "Estadual",
    "deputado": "Renato Câmara",
    "cidade": "JATEI",
    "escola": "EE Prof.ª Bernadete dos Santos Leite",
    "cargo": "Adjunto",
    "nome": "Maria José da Silva Vieira Correia",
    "telefone": "(67) 9.9686-1596"
  },
  {
    "tipo": "Estadual",
    "deputado": "Renato Câmara",
    "cidade": "JATEI",
    "escola": "EE Prof.ª Bernadete dos Santos Leite",
    "cargo": "Diretor",
    "nome": "Andréa de Souza Silva",
    "telefone": "(67) 9.9633-4463"
  },
  {
    "tipo": "Estadual",
    "deputado": "Renato Câmara",
    "cidade": "RIO BRILHANTE",
    "escola": "EE Etalívio Pereira Martins",
    "cargo": "Adjunto",
    "nome": "Eleci Gonçalves  Serra Leite",
    "telefone": "(67)9.9975-7498"
  },
  {
    "tipo": "Estadual",
    "deputado": "Renato Câmara",
    "cidade": "RIO BRILHANTE",
    "escola": "EE Etalívio Pereira Martins",
    "cargo": "Diretor",
    "nome": "Vagner Caceres Soares",
    "telefone": "(67) 9.9882-8014"
  },
  {
    "tipo": "Estadual",
    "deputado": "Rinaldo Modesto",
    "cidade": "DOURADOS",
    "escola": "EE Prof.ª Floriana Lopes",
    "cargo": "Adjunto",
    "nome": "Francisca Cleide da R. Teixeira",
    "telefone": "(67) 9.8126-1300"
  },
  {
    "tipo": "Estadual",
    "deputado": "Rinaldo Modesto",
    "cidade": "DOURADOS",
    "escola": "EE Prof.ª Floriana Lopes",
    "cargo": "Diretor",
    "nome": "Arlei Menguer de Castilhos",
    "telefone": "(67) 9.9904-3069"
  },
  {
    "tipo": "Estadual",
    "deputado": "Rinaldo Modesto",
    "cidade": "DOURADOS",
    "escola": "EE Ramona da Silva Pedroso",
    "cargo": "Adjunto",
    "nome": "Patrik Talhina do Amaral",
    "telefone": "(67) 9.8473-8053"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "DEODÁPOLIS",
    "escola": "EE 13 de Maio",
    "cargo": "Adjunto",
    "nome": "Tiago Henrique Rodrigues da Silva",
    "telefone": "(67) 9.9984-4611"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "DEODÁPOLIS",
    "escola": "EE Lagoa Bonita",
    "cargo": "Diretor",
    "nome": "Sara Livino de Jesus",
    "telefone": "(67) 9.9909-9255"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "DOURADOS",
    "escola": "CEEJA-de Dourados",
    "cargo": "Adjunto",
    "nome": "Marisa Martins da Silva",
    "telefone": "(67) 9.9971-6672"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "DOURADOS",
    "escola": "CEEJA-de Dourados",
    "cargo": "Diretor",
    "nome": "Daniela Meili Staut",
    "telefone": "(67) 9.9234-0364"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "DOURADOS",
    "escola": "Centro Estadual de Educação Profissional \"Profª. Evanilde Costa da Silva\"",
    "cargo": "Adjunto",
    "nome": "Elza Alves Pereira Bonfa",
    "telefone": "(67) 9.9692-3716"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "DOURADOS",
    "escola": "Centro Estadual de Educação Profissional \"Profª. Evanilde Costa da Silva\"",
    "cargo": "Diretor",
    "nome": "Alini Aparecida de Lima Nolasco",
    "telefone": "(67) 9.9648-7577"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "DOURADOS",
    "escola": "EE Antônio Vicente Azambuja",
    "cargo": "Adjunto",
    "nome": "Micheli de Almeida Cardoso",
    "telefone": "(67)9.9611-5646"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "DOURADOS",
    "escola": "EE Antônio Vicente Azambuja",
    "cargo": "Diretor",
    "nome": "Maria José Lins",
    "telefone": "(67) 9.9977-9663"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "DOURADOS",
    "escola": "EE Castro Alves",
    "cargo": "Adjunto",
    "nome": "Josiléia Nairane Conrado Soligo",
    "telefone": "(67) 9627-3752"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "DOURADOS",
    "escola": "EE Castro Alves",
    "cargo": "Diretor",
    "nome": "Márcia Regina da Silva Wider",
    "telefone": "(67) 9846-0877"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "DOURADOS",
    "escola": "EE Indígena de EM Intercultural Guateka – Marçal de Souza",
    "cargo": "Adjunto",
    "nome": "Marilda Azevedo de Souza",
    "telefone": "(67) 9.9971-6990"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "DOURADOS",
    "escola": "EE Joaquim Vaz de Oliveira",
    "cargo": "Diretor",
    "nome": "Rosineia Rodrigues Moreno",
    "telefone": "(67) 9941-2810"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "DOURADOS",
    "escola": "EE Menodora Fialho de Figueiredo",
    "cargo": "Adjunto",
    "nome": "Marcia da Silva Gomes",
    "telefone": "(67) 9.9698-4673"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "DOURADOS",
    "escola": "EE Menodora Fialho de Figueiredo",
    "cargo": "Diretor",
    "nome": "Aline Midori Takahara",
    "telefone": "(67) 9.8162-0169"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "DOURADOS",
    "escola": "EE Pastor Daniel Berg",
    "cargo": "Diretor",
    "nome": "Lisiane dos Santos Borella",
    "telefone": "(67) 9.9686-0798"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "DOURADOS",
    "escola": "EE Presidente Getulio Vargas",
    "cargo": "Adjunto",
    "nome": "Adriana Prolo",
    "telefone": "(67) 9.9956-6484"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "DOURADOS",
    "escola": "EE Presidente Tancredo Neves",
    "cargo": "Diretor",
    "nome": "Alcides Peres Junior",
    "telefone": "(67) 9. 9945-6998"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "DOURADOS",
    "escola": "EE Prof. José Pereira Lins",
    "cargo": "Adjunto",
    "nome": "Marcia Cristiane Felipczuk",
    "telefone": "(67) 9.9601-3887"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "DOURADOS",
    "escola": "EE Prof. José Pereira Lins",
    "cargo": "Diretor",
    "nome": "Sandra Saldivar Oviedo da Silva",
    "telefone": "(67) 9.9695 4221"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "DOURADOS",
    "escola": "EE Ramona da Silva Pedroso",
    "cargo": "Diretor",
    "nome": "Fabio Almeida e Silva",
    "telefone": "(67) 9.9965-9806"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "DOURADOS",
    "escola": "EE Vereador Moacir Djalma Barros",
    "cargo": "Diretor",
    "nome": "Regina Rozania Lima de Araújo",
    "telefone": "(67) 9999-9910"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "DOURADOS",
    "escola": "EE Vilmar Vieira Matos",
    "cargo": "Adjunto",
    "nome": "Alessandra dos Santos Olmedo",
    "telefone": "(67) 9.9653-0850"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "ITAPORÃ",
    "escola": "EE Antonio João Ribeiro",
    "cargo": "Adjunto",
    "nome": "Cláudio Cristhiano da S. Nogueira",
    "telefone": "(67) 9928-2052"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "ITAPORÃ",
    "escola": "EE Antonio João Ribeiro",
    "cargo": "Diretor",
    "nome": "Lislaine Borges dos Santos Tino",
    "telefone": "(67) 9.9608-6175"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "ITAPORÃ",
    "escola": "EE Edson Bezerra",
    "cargo": "Adjunto",
    "nome": "Viviani Rodelini Mendonça",
    "telefone": "(67) 9.9973-7404"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "ITAPORÃ",
    "escola": "EE Edson Bezerra",
    "cargo": "Diretor",
    "nome": "Elaine Cleia Leite",
    "telefone": "(67)9 9973-5251"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "ITAPORÃ",
    "escola": "EE Olívia Paula",
    "cargo": "Diretor",
    "nome": "Maria de Lourdes Targino de Oliveira",
    "telefone": "(67) 9.9931-0104"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "ITAPORÃ",
    "escola": "EE Princesa Izabel",
    "cargo": "Diretor",
    "nome": "Rosenir Salete Endres",
    "telefone": "(67) 9.9653-4135"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "ITAPORÃ",
    "escola": "EE Rodrigues Alves",
    "cargo": "Adjunto",
    "nome": "Venicio Franco Borges",
    "telefone": "(67) 9.9820-3981"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "ITAPORÃ",
    "escola": "EE Rodrigues Alves",
    "cargo": "Diretor",
    "nome": "Célia Regina Frota Boni",
    "telefone": "(67) 9.9648-8299"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "ITAPORÃ",
    "escola": "EE Senador Saldanha Derzi",
    "cargo": "Adjunto",
    "nome": "Lucivania Gotardi Ribeiro Balasso",
    "telefone": "(67) 99905-7200"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "ITAPORÃ",
    "escola": "EE Senador Saldanha Derzi",
    "cargo": "Diretor",
    "nome": "Jane Mara Martins Correia Simplício",
    "telefone": "(67)  9.9962-5133"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "JATEI",
    "escola": "EE Prof. Joaquim Alfredo Soares Vianna",
    "cargo": "Diretor",
    "nome": "Robson Assunção dos Santos",
    "telefone": "(67) 9.9927-6072"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "LAGUNA CARAPÃ",
    "escola": "EE Álvaro Martins dos Santos",
    "cargo": "Adjunto",
    "nome": "Dejacir Machado dos Santos",
    "telefone": "(67) 9.9999-3061"
  },
  {
    "tipo": "Estadual",
    "deputado": "Zé Teixeira",
    "cidade": "LAGUNA CARAPÃ",
    "escola": "EE Álvaro Martins dos Santos",
    "cargo": "Diretor",
    "nome": "Mauro Sergio Almeida de Lima",
    "telefone": "(67) 9.9617-8788"
  },
  {
    "tipo": "Federal",
    "deputado": "Beto Pereira",
    "cidade": "DEODÁPOLIS",
    "escola": "EE Scila Médici",
    "cargo": "Diretor",
    "nome": "Evandro Sérgio de Souza Goncales",
    "telefone": "(67) 9.9901-1977"
  },
  {
    "tipo": "Federal",
    "deputado": "Beto Pereira",
    "cidade": "GLÓRIA DE DOURADOS",
    "escola": "EE Prof.ª Eufrosina Pinto",
    "cargo": "Diretor",
    "nome": "Marcio Renato Gomes",
    "telefone": "(67) 9.9963-4896"
  },
  {
    "tipo": "Federal",
    "deputado": "Beto Pereira",
    "cidade": "VICENTINA",
    "escola": "EE Emannuel Pinheiro",
    "cargo": "Diretor",
    "nome": "Maria Divaldete Mello de Almeida",
    "telefone": "(67) 9.9642-8295"
  },
  {
    "tipo": "Federal",
    "deputado": "Beto Pereira",
    "cidade": "VICENTINA",
    "escola": "EE Padre José Daniel",
    "cargo": "Adjunto",
    "nome": "Maria do Socorro Alves B. Cardoso",
    "telefone": "(67) 9.9925-1625"
  },
  {
    "tipo": "Federal",
    "deputado": "Beto Pereira",
    "cidade": "VICENTINA",
    "escola": "EE Padre José Daniel",
    "cargo": "Diretor",
    "nome": "José André de Alcantara",
    "telefone": "(67) 9.921-3657"
  },
  {
    "tipo": "Federal",
    "deputado": "Geraldo Resende",
    "cidade": "DOURADOS",
    "escola": "EE Antônio Vicente Azambuja",
    "cargo": "Diretor",
    "nome": "Maria José Lins",
    "telefone": "(67) 9.9977-9663"
  },
  {
    "tipo": "Federal",
    "deputado": "Geraldo Resende",
    "cidade": "DOURADOS",
    "escola": "EE Indígena de EM Intercultural Guateka – Marçal de Souza",
    "cargo": "Diretor",
    "nome": "Luiz de Souza Freire Junior",
    "telefone": "(67) 9.9861-1414"
  },
  {
    "tipo": "Federal",
    "deputado": "Geraldo Resende",
    "cidade": "DOURADOS",
    "escola": "EE Prof. José Pereira Lins",
    "cargo": "Diretor",
    "nome": "Sandra Saldivar Oviedo da Silva",
    "telefone": "(67) 9.9695 4221"
  },
  {
    "tipo": "Federal",
    "deputado": "Isa Marcondes",
    "cidade": "ITAPORÃ",
    "escola": "EE Edson Bezerra",
    "cargo": "Diretor",
    "nome": "Elaine Cleia Leite",
    "telefone": "(67)9 9973-5251"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "CAARAPÓ",
    "escola": "EE Frei João Damasceno",
    "cargo": "Adjunto",
    "nome": "Fernanda Venacio da Silva",
    "telefone": "(67) 9.9930-2701"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "CAARAPÓ",
    "escola": "EE Frei João Damasceno",
    "cargo": "Diretor",
    "nome": "Nei Geller",
    "telefone": "(67)9.927-2396"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "CAARAPÓ",
    "escola": "EE Indígena EM “Yvy Poty”.",
    "cargo": "Diretor",
    "nome": "Valdinei Marques  Mendonça",
    "telefone": "(67)9.9642-9814"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "CAARAPÓ",
    "escola": "EE Padre José de Anchieta",
    "cargo": "Diretor",
    "nome": "Eduardo Bonfa",
    "telefone": "(67)99921-9887"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DEODÁPOLIS",
    "escola": "EE 13 de Maio",
    "cargo": "Adjunto",
    "nome": "Tiago Henrique Rodrigues da Silva",
    "telefone": "(67) 9.9984-4611"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DEODÁPOLIS",
    "escola": "EE 13 de Maio",
    "cargo": "Diretor",
    "nome": "Vagna Dias  de Azevedo  Lourenço",
    "telefone": "(67) 9.9337-3468"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DEODÁPOLIS",
    "escola": "EE João Baptista Pereira",
    "cargo": "Diretor",
    "nome": "Jean Carlos da Silva",
    "telefone": "(67) 9.9987-1905"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DEODÁPOLIS",
    "escola": "EE Lagoa Bonita",
    "cargo": "Diretor",
    "nome": "Sara Livino de Jesus",
    "telefone": "(67) 9.9909-9255"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DEODÁPOLIS",
    "escola": "EE Porto Vilma",
    "cargo": "Adjunto",
    "nome": "Edna Martins",
    "telefone": "(67) 9.9819-4237"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DEODÁPOLIS",
    "escola": "EE Porto Vilma",
    "cargo": "Diretor",
    "nome": "Givaldo Santos Oliveira",
    "telefone": "(67) 9.9681-9470"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DEODÁPOLIS",
    "escola": "EE Scila Médici",
    "cargo": "Adjunto",
    "nome": "Josane Marcelino Pacheco",
    "telefone": "(67) 9.9606-4111"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DOURADOS",
    "escola": "Centro Estadual de Educação Profissional \"Profª. Evanilde Costa da Silva\"",
    "cargo": "Diretor",
    "nome": "Alini Aparecida de Lima Nolasco",
    "telefone": "(67) 9.9648-7577"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DOURADOS",
    "escola": "EE Abigail Borralho",
    "cargo": "Diretor",
    "nome": "Ramao Agedo Vieira",
    "telefone": "(67) 9.9832-2754"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DOURADOS",
    "escola": "EE Antônio Vicente Azambuja",
    "cargo": "Adjunto",
    "nome": "Micheli de Almeida Cardoso",
    "telefone": "(67)9.9611-5646"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DOURADOS",
    "escola": "EE Castro Alves",
    "cargo": "Adjunto",
    "nome": "Josiléia Nairane Conrado Soligo",
    "telefone": "(67) 9627-3752"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DOURADOS",
    "escola": "EE Castro Alves",
    "cargo": "Diretor",
    "nome": "Márcia Regina da Silva Wider",
    "telefone": "(67) 9846-0877"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DOURADOS",
    "escola": "EE Indígena de EM Intercultural Guateka – Marçal de Souza",
    "cargo": "Adjunto",
    "nome": "Marilda Azevedo de Souza",
    "telefone": "(67) 9.9971-6990"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DOURADOS",
    "escola": "EE Maria da Glória Muzzi  Ferreira",
    "cargo": "Diretor",
    "nome": "Pascolalino  Cornelia Angelico",
    "telefone": "(67) 9920-0963"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DOURADOS",
    "escola": "EE Menodora Fialho de Figueiredo",
    "cargo": "Adjunto",
    "nome": "Marcia da Silva Gomes",
    "telefone": "(67) 9.9698-4673"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DOURADOS",
    "escola": "EE Menodora Fialho de Figueiredo",
    "cargo": "Diretor",
    "nome": "Aline Midori Takahara",
    "telefone": "(67) 9.8162-0169"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DOURADOS",
    "escola": "EE Min. João Paulo dos Reis Veloso",
    "cargo": "Adjunto",
    "nome": "Lincoln Christian Fernandes",
    "telefone": "(67) 9.9991-6024"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DOURADOS",
    "escola": "EE Min. João Paulo dos Reis Veloso",
    "cargo": "Diretor",
    "nome": "José Carlos Severiano de Souza",
    "telefone": "(67) 9.9257-3603"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DOURADOS",
    "escola": "EE Presidente Getulio Vargas",
    "cargo": "Adjunto",
    "nome": "Adriana Prolo",
    "telefone": "(67) 9.9956-6484"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DOURADOS",
    "escola": "EE Presidente Getulio Vargas",
    "cargo": "Diretor",
    "nome": "José Antônio do Nascimento Junior",
    "telefone": "(67) 9.9914-7374"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DOURADOS",
    "escola": "EE Presidente Tancredo Neves",
    "cargo": "Adjunto",
    "nome": "Christiane dos Santos F. Oliveira",
    "telefone": "(67)9. 9695-5682"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DOURADOS",
    "escola": "EE Presidente Tancredo Neves",
    "cargo": "Diretor",
    "nome": "Alcides Peres Junior",
    "telefone": "(67) 9. 9945-6998"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DOURADOS",
    "escola": "EE Prof. José Pereira Lins",
    "cargo": "Adjunto",
    "nome": "Marcia Cristiane Felipczuk",
    "telefone": "(67) 9.9601-3887"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DOURADOS",
    "escola": "EE Ramona da Silva Pedroso",
    "cargo": "Adjunto",
    "nome": "Patrik Talhina do Amaral",
    "telefone": "(67) 9.8473-8053"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DOURADOS",
    "escola": "EE Ramona da Silva Pedroso",
    "cargo": "Diretor",
    "nome": "Fabio Almeida e Silva",
    "telefone": "(67) 9.9965-9806"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "DOURADOS",
    "escola": "EE Vilmar Vieira Matos",
    "cargo": "Adjunto",
    "nome": "Alessandra dos Santos Olmedo",
    "telefone": "(67) 9.9653-0850"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "GLÓRIA DE DOURADOS",
    "escola": "EE Prof.ª Vânia Medeiros Lopes",
    "cargo": "Diretor",
    "nome": "Maria Eliete dos Santos de Matos",
    "telefone": "(67) 9.9920-4943"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "GLÓRIA DE DOURADOS",
    "escola": "EE Weimar Torres",
    "cargo": "Diretor",
    "nome": "Eliane Milane e Silva Rodrigues",
    "telefone": "(67) 9.9663-6459"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "ITAPORÃ",
    "escola": "EE Antonio João Ribeiro",
    "cargo": "Diretor",
    "nome": "Lislaine Borges dos Santos Tino",
    "telefone": "(67) 9.9608-6175"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "ITAPORÃ",
    "escola": "EE Edson Bezerra",
    "cargo": "Adjunto",
    "nome": "Viviani Rodelini Mendonça",
    "telefone": "(67) 9.9973-7404"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "ITAPORÃ",
    "escola": "EE Olívia Paula",
    "cargo": "Diretor",
    "nome": "Maria de Lourdes Targino de Oliveira",
    "telefone": "(67) 9.9931-0104"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "ITAPORÃ",
    "escola": "EE Rodrigues Alves",
    "cargo": "Adjunto",
    "nome": "Venicio Franco Borges",
    "telefone": "(67) 9.9820-3981"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "ITAPORÃ",
    "escola": "EE Rodrigues Alves",
    "cargo": "Diretor",
    "nome": "Célia Regina Frota Boni",
    "telefone": "(67) 9.9648-8299"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "ITAPORÃ",
    "escola": "EE Senador Saldanha Derzi",
    "cargo": "Adjunto",
    "nome": "Lucivania Gotardi Ribeiro Balasso",
    "telefone": "(67) 99905-7200"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "ITAPORÃ",
    "escola": "EE Senador Saldanha Derzi",
    "cargo": "Diretor",
    "nome": "Jane Mara Martins Correia Simplício",
    "telefone": "(67)  9.9962-5133"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "JATEI",
    "escola": "EE Prof. Joaquim Alfredo Soares Vianna",
    "cargo": "Diretor",
    "nome": "Robson Assunção dos Santos",
    "telefone": "(67) 9.9927-6072"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "JATEI",
    "escola": "EE Prof.ª Bernadete dos Santos Leite",
    "cargo": "Adjunto",
    "nome": "Maria José da Silva Vieira Correia",
    "telefone": "(67) 9.9686-1596"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "JATEI",
    "escola": "EE Prof.ª Bernadete dos Santos Leite",
    "cargo": "Diretor",
    "nome": "Andréa de Souza Silva",
    "telefone": "(67) 9.9633-4463"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "LAGUNA CARAPÃ",
    "escola": "EE Álvaro Martins dos Santos",
    "cargo": "Adjunto",
    "nome": "Dejacir Machado dos Santos",
    "telefone": "(67) 9.9999-3061"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "LAGUNA CARAPÃ",
    "escola": "EE Álvaro Martins dos Santos",
    "cargo": "Diretor",
    "nome": "Mauro Sergio Almeida de Lima",
    "telefone": "(67) 9.9617-8788"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "MARACAJU",
    "escola": "EE Manoel Ferreira de Lima",
    "cargo": "Adjunto",
    "nome": "Paula Fernanda de M. Francisco",
    "telefone": "(67) 9.9111-6756"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "MARACAJU",
    "escola": "EE Manoel Ferreira de Lima",
    "cargo": "Diretor",
    "nome": "Erenil Martins Cardoso",
    "telefone": "(67) 9.8418-4251"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "MARACAJU",
    "escola": "EE Pe. Constantino de Monte",
    "cargo": "Adjunto",
    "nome": "Sheila Moreira Matos Dias",
    "telefone": "(67) 9.9253-2948"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "RIO BRILHANTE",
    "escola": "EE Etalívio Pereira Martins",
    "cargo": "Adjunto",
    "nome": "Eleci Gonçalves  Serra Leite",
    "telefone": "(67)9.9975-7498"
  },
  {
    "tipo": "Federal",
    "deputado": "Jaime Verruck",
    "cidade": "RIO BRILHANTE",
    "escola": "EE Etalívio Pereira Martins",
    "cargo": "Diretor",
    "nome": "Vagner Caceres Soares",
    "telefone": "(67) 9.9882-8014"
  },
  {
    "tipo": "Federal",
    "deputado": "Mara Caseiro",
    "cidade": "CAARAPÓ",
    "escola": "EE Arcênio Rojas",
    "cargo": "Diretor",
    "nome": "Solon Rodrigues Lima",
    "telefone": "(67)9.9876- 8613"
  },
  {
    "tipo": "Federal",
    "deputado": "Mara Caseiro",
    "cidade": "DOURADINA",
    "escola": "EE Barão do Rio Branco",
    "cargo": "Adjunto",
    "nome": "Natalia Santos Oliveira",
    "telefone": "(67) 9.9978-9532"
  },
  {
    "tipo": "Federal",
    "deputado": "Mara Caseiro",
    "cidade": "DOURADINA",
    "escola": "EE Barão do Rio Branco",
    "cargo": "Diretor",
    "nome": "Janaina Spessoto Sais",
    "telefone": "(67) 9.9988-5457"
  },
  {
    "tipo": "Federal",
    "deputado": "Mara Caseiro",
    "cidade": "DOURADOS",
    "escola": "CEEJA-de Dourados",
    "cargo": "Adjunto",
    "nome": "Marisa Martins da Silva",
    "telefone": "(67) 9.9971-6672"
  },
  {
    "tipo": "Federal",
    "deputado": "Mara Caseiro",
    "cidade": "DOURADOS",
    "escola": "CEEJA-de Dourados",
    "cargo": "Diretor",
    "nome": "Daniela Meili Staut",
    "telefone": "(67) 9.9234-0364"
  },
  {
    "tipo": "Federal",
    "deputado": "Mara Caseiro",
    "cidade": "DOURADOS",
    "escola": "Centro Estadual de Educação Profissional \"Profª. Evanilde Costa da Silva\"",
    "cargo": "Adjunto",
    "nome": "Elza Alves Pereira Bonfa",
    "telefone": "(67) 9.9692-3716"
  },
  {
    "tipo": "Federal",
    "deputado": "Mara Caseiro",
    "cidade": "DOURADOS",
    "escola": "EE Antônia da Silveira Capilé",
    "cargo": "Adjunto",
    "nome": "Elaine Costa Guimarães",
    "telefone": "(67) 9.9971-1755"
  },
  {
    "tipo": "Federal",
    "deputado": "Mara Caseiro",
    "cidade": "DOURADOS",
    "escola": "EE Antônia da Silveira Capilé",
    "cargo": "Diretor",
    "nome": "João  Henrique B. de Godoy Filho",
    "telefone": "(67) 9.9935-1566"
  },
  {
    "tipo": "Federal",
    "deputado": "Mara Caseiro",
    "cidade": "DOURADOS",
    "escola": "EE Floriano Viegas  Machado",
    "cargo": "Adjunto",
    "nome": "Karla Granja Guimaraes Kupfer",
    "telefone": "(67) 9245-2822"
  },
  {
    "tipo": "Federal",
    "deputado": "Mara Caseiro",
    "cidade": "DOURADOS",
    "escola": "EE Joaquim Vaz de Oliveira",
    "cargo": "Adjunto",
    "nome": "Kely Leal da Silva Palerno",
    "telefone": "(67) 99953-1645"
  },
  {
    "tipo": "Federal",
    "deputado": "Mara Caseiro",
    "cidade": "DOURADOS",
    "escola": "EE Joaquim Vaz de Oliveira",
    "cargo": "Diretor",
    "nome": "Rosineia Rodrigues Moreno",
    "telefone": "(67) 9941-2810"
  },
  {
    "tipo": "Federal",
    "deputado": "Mara Caseiro",
    "cidade": "DOURADOS",
    "escola": "EE Rita Angelina Barbosa Silveira",
    "cargo": "Adjunto",
    "nome": "Peres Antonio Mello de Souza",
    "telefone": "(67) 9.9615-6760"
  },
  {
    "tipo": "Federal",
    "deputado": "Mara Caseiro",
    "cidade": "DOURADOS",
    "escola": "EE Rita Angelina Barbosa Silveira",
    "cargo": "Diretor",
    "nome": "Tarsila Bibiane Lima Ramos",
    "telefone": "(67) 9.9617-5195"
  },
  {
    "tipo": "Federal",
    "deputado": "Mara Caseiro",
    "cidade": "FÁTIMA DO SUL",
    "escola": "EE Vila Brasil",
    "cargo": "Adjunto",
    "nome": "Rozani Moraes de Lima Reis",
    "telefone": "(67) 9.9987-2704"
  },
  {
    "tipo": "Federal",
    "deputado": "Mara Caseiro",
    "cidade": "FÁTIMA DO SUL",
    "escola": "EE Vila Brasil",
    "cargo": "Diretor",
    "nome": "Caique Bento Casotti",
    "telefone": "(67)9.9631-7097"
  },
  {
    "tipo": "Federal",
    "deputado": "Mara Caseiro",
    "cidade": "GLÓRIA DE DOURADOS",
    "escola": "EE Prof.ª Eufrosina Pinto",
    "cargo": "Adjunto",
    "nome": "keli Tatiene Rodrigues de Sá",
    "telefone": "(67) 9.9826-7878"
  },
  {
    "tipo": "Federal",
    "deputado": "Mara Caseiro",
    "cidade": "ITAPORÃ",
    "escola": "EE Princesa Izabel",
    "cargo": "Diretor",
    "nome": "Rosenir Salete Endres",
    "telefone": "(67) 9.9653-4135"
  },
  {
    "tipo": "Federal",
    "deputado": "Mara Caseiro",
    "cidade": "MARACAJU",
    "escola": "EE Cambarai",
    "cargo": "Adjunto",
    "nome": "Géllys Luckas da Silva Agostini",
    "telefone": "(67) 9.890-4140"
  },
  {
    "tipo": "Federal",
    "deputado": "Mara Caseiro",
    "cidade": "MARACAJU",
    "escola": "EE Cambarai",
    "cargo": "Diretor",
    "nome": "Katiane Silva de Souza",
    "telefone": "(67) 9.8422-4228"
  },
  {
    "tipo": "Federal",
    "deputado": "Mara Caseiro",
    "cidade": "MARACAJU",
    "escola": "EE Cívico-Militar Coronel  Lima de Figueiredo",
    "cargo": "Adjunto",
    "nome": "Elias Antonio Alves Sobrinho",
    "telefone": "(67)9.9626-5565"
  },
  {
    "tipo": "Federal",
    "deputado": "Mara Caseiro",
    "cidade": "MARACAJU",
    "escola": "EE Cívico-Militar Coronel  Lima de Figueiredo",
    "cargo": "Diretor",
    "nome": "Cleber Vanderlei Pinto Colpo",
    "telefone": "(67) 9.9941-3873"
  },
  {
    "tipo": "Federal",
    "deputado": "Mara Caseiro",
    "cidade": "RIO BRILHANTE",
    "escola": "EE Profª. Ligia Terezinha Martins",
    "cargo": "Adjunto",
    "nome": "Elton Tagara Mareco",
    "telefone": "(67)99659-9971"
  },
  {
    "tipo": "Federal",
    "deputado": "Mara Caseiro",
    "cidade": "RIO BRILHANTE",
    "escola": "EE Profª. Ligia Terezinha Martins",
    "cargo": "Diretor",
    "nome": "Lucimara Faustino Barbosa Cattani",
    "telefone": "(67) 9.9973-4348"
  },
  {
    "tipo": "Federal",
    "deputado": "Mara Caseiro",
    "cidade": "VICENTINA",
    "escola": "EE São José",
    "cargo": "Diretor",
    "nome": "Claudia Regina de O. e Silva Souza",
    "telefone": "(67) 9.9643-4014"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "CAARAPÓ",
    "escola": "EE Indígena EM “Yvy Poty”.",
    "cargo": "Adjunto",
    "nome": "Cristiani da Silva Rocha",
    "telefone": "(67)9.9840-3698"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "CAARAPÓ",
    "escola": "EE Prof. Joaquim Alfredo Soares Vianna",
    "cargo": "Diretor",
    "nome": "Luis Carlos de Andrade",
    "telefone": "(67) 9.9870-6396"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "CAARAPÓ",
    "escola": "EE Prof.ª Cleuza Aparecida V. Galhardo",
    "cargo": "Adjunto",
    "nome": "Andréa Menegatti Recalde",
    "telefone": "(67)9.9876-7630"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "CAARAPÓ",
    "escola": "EE Prof.ª Cleuza Aparecida V. Galhardo",
    "cargo": "Diretor",
    "nome": "Nilza Elena Zambão",
    "telefone": "(67) 9.9912 4658"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "DOURADOS",
    "escola": "EE Floriano Viegas  Machado",
    "cargo": "Diretor",
    "nome": "Julio Cezar dos Santos",
    "telefone": "(67) 9601-1845"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "DOURADOS",
    "escola": "EE Maria da Glória Muzzi  Ferreira",
    "cargo": "Adjunto",
    "nome": "Alessandro Bezerra de Oliveira",
    "telefone": "(67) 9.9960-2551"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "DOURADOS",
    "escola": "EE Pastor Daniel Berg",
    "cargo": "Diretor",
    "nome": "Lisiane dos Santos Borella",
    "telefone": "(67) 9.9686-0798"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "DOURADOS",
    "escola": "EE Presidente Vargas",
    "cargo": "Adjunto",
    "nome": "Rodrigo Lima Amaro",
    "telefone": "(67) 9.8472-4518"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "DOURADOS",
    "escola": "EE Presidente Vargas",
    "cargo": "Diretor",
    "nome": "Fernando Fernandes Rodrigues",
    "telefone": "(67) 9.9651-6327"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "DOURADOS",
    "escola": "EE Prof. Alício Araújo",
    "cargo": "Adjunto",
    "nome": "Adriano Cosma Cabreira",
    "telefone": "(67) 9.9637-1770"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "DOURADOS",
    "escola": "EE Prof. Alício Araújo",
    "cargo": "Diretor",
    "nome": "Marcos Falco de Lima",
    "telefone": "(67) 9.9987 1805"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "DOURADOS",
    "escola": "EE Prof. Celso Müller do Amaral",
    "cargo": "Adjunto",
    "nome": "Elma Aparecida  Gonçalves",
    "telefone": "(67) 9.9914-5863"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "DOURADOS",
    "escola": "EE Prof. Celso Müller do Amaral",
    "cargo": "Diretor",
    "nome": "Wagner José de Souza",
    "telefone": "(67) 9.9227-6172"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "DOURADOS",
    "escola": "EE Prof.ª Floriana Lopes",
    "cargo": "Adjunto",
    "nome": "Francisca Cleide da R. Teixeira",
    "telefone": "(67) 9.8126-1300"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "DOURADOS",
    "escola": "EE Prof.ª Floriana Lopes",
    "cargo": "Diretor",
    "nome": "Arlei Menguer de Castilhos",
    "telefone": "(67) 9.9904-3069"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "DOURADOS",
    "escola": "EE Vereador Moacir Djalma Barros",
    "cargo": "Adjunto",
    "nome": "Daniel Stockamann",
    "telefone": "(67) 9.9943-8695"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "DOURADOS",
    "escola": "EE Vereador Moacir Djalma Barros",
    "cargo": "Diretor",
    "nome": "Regina Rozania Lima de Araújo",
    "telefone": "(67) 9999-9910"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "DOURADOS",
    "escola": "EE Vilmar Vieira Matos",
    "cargo": "Diretor",
    "nome": "Ivan Ferreira Pereira",
    "telefone": "(67) 9.9657-1131"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "FÁTIMA DO SUL",
    "escola": "EE Jonas Belarmino da Silva",
    "cargo": "Adjunto",
    "nome": "Edilene de Fátima Lima",
    "telefone": "*"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "FÁTIMA DO SUL",
    "escola": "EE Jonas Belarmino da Silva",
    "cargo": "Diretor",
    "nome": "Sidnei Ferreira Rocha",
    "telefone": "(67) 9.9644-7540"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "FÁTIMA DO SUL",
    "escola": "EE Senador Filinto Müller",
    "cargo": "Adjunto",
    "nome": "Leonardo de David Muhamed Zahra",
    "telefone": "(67) 9.9996-9994"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "FÁTIMA DO SUL",
    "escola": "EE Senador Filinto Müller",
    "cargo": "Diretor",
    "nome": "Altair Vieira de Albuquerque",
    "telefone": "(67) 9.9974-1718"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "FÁTIMA DO SUL",
    "escola": "EE Vicente Pallotti",
    "cargo": "Adjunto",
    "nome": "Luiz Eduardo Vieira Pereira",
    "telefone": "(67) 9.9832-7712"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "FÁTIMA DO SUL",
    "escola": "EE Vicente Pallotti",
    "cargo": "Diretor",
    "nome": "Gislaine Cristina dos Santos N. Rocha",
    "telefone": "(67) 9.9808-1825"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "ITAPORÃ",
    "escola": "EE Antonio João Ribeiro",
    "cargo": "Adjunto",
    "nome": "Cláudio Cristhiano da S. Nogueira",
    "telefone": "(67) 9928-2052"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "MARACAJU",
    "escola": "EE Pe. Constantino de Monte",
    "cargo": "Diretor",
    "nome": "Arlon Cossetin Branco",
    "telefone": "(67) 9.9636-9692"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "RIO BRILHANTE",
    "escola": "EE Fernando Corrêa da Costa",
    "cargo": "Adjunto",
    "nome": "Marcus Vinicius da Costa",
    "telefone": "(67) 9690-0319"
  },
  {
    "tipo": "Federal",
    "deputado": "Rose Modesto",
    "cidade": "RIO BRILHANTE",
    "escola": "EE Fernando Corrêa da Costa",
    "cargo": "Diretor",
    "nome": "Mario Cesar Furlan",
    "telefone": "(67) 9.9978-4215"
  }
];

  const [senhaDigitada, setSenhaDigitada] = useState("");
  const [autenticado, setAutenticado] = useState(localStorage.getItem("radar_auth") === "ok");
  const [tela, setTela] = useState("inicio");
  const [registros, setRegistros] = useState([]);
  const [form, setForm] = useState(formLimpo);
  const [editandoId, setEditandoId] = useState(null);
  const [formAberto, setFormAberto] = useState(null);
  const [filtroAtivo, setFiltroAtivo] = useState(null);
  const [municipioIndicador, setMunicipioIndicador] = useState("GERAL");
  const [detalhePolitico, setDetalhePolitico] = useState(null);
  const [agendaGestoresAberta, setAgendaGestoresAberta] = useState(false);
  const [filtroAgendaMunicipio, setFiltroAgendaMunicipio] = useState("GERAL");
  const [filtroAgendaCargo, setFiltroAgendaCargo] = useState("TODOS");
  const [buscaAgenda, setBuscaAgenda] = useState("");

  useEffect(() => { if (autenticado) carregarRegistros(); }, [autenticado]);

  async function carregarRegistros() {
    const dados = await getDocs(collection(db, "reunioes_gestores"));
    setRegistros(dados.docs.map((item) => ({ id: item.id, ...item.data() })));
  }

  function entrarNaPlataforma() {
    if (senhaDigitada === SENHA_ACESSO) {
      localStorage.setItem("radar_auth", "ok");
      setAutenticado(true);
    } else {
      alert("Senha incorreta.");
    }
  }

  function sairDaPlataforma() {
    localStorage.removeItem("radar_auth");
    setAutenticado(false);
    setTela("inicio");
    setSenhaDigitada("");
  }

  function ordenarPorEscola(lista) {
    return [...lista].sort((a, b) => String(a.escola || "").localeCompare(String(b.escola || ""), "pt-BR"));
  }

  function base() {
    return municipioIndicador === "GERAL" ? registros : registros.filter((r) => r.municipio === municipioIndicador);
  }

  function resumirDeputados(tipo) {
    const mapa = {};

    apoiosPoliticosBase
      .filter((registro) => registro.tipo === tipo)
      .forEach((registro) => {
        if (!mapa[registro.deputado]) {
          mapa[registro.deputado] = {
            tipo,
            deputado: registro.deputado,
            diretores: 0,
            adjuntos: 0,
            total: 0
          };
        }

        if (registro.cargo === "Diretor") mapa[registro.deputado].diretores += 1;
        if (registro.cargo === "Adjunto") mapa[registro.deputado].adjuntos += 1;
        mapa[registro.deputado].total += 1;
      });

    return Object.values(mapa).sort(
      (a, b) => b.total - a.total || a.deputado.localeCompare(b.deputado, "pt-BR")
    );
  }

  const deputadosEstaduais = resumirDeputados("Estadual");
  const deputadosFederais = resumirDeputados("Federal");

  function normalizarBusca(texto) {
    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function whatsappLink(telefone) {
    const digitos = String(telefone || "").replace(/\D/g, "");
    if (digitos.length < 10) return "";
    const numero = digitos.startsWith("55") ? digitos : `55${digitos}`;
    return `https://wa.me/${numero}`;
  }

  function registrosDoDeputado(item) {
    if (!item) return [];

    return apoiosPoliticosBase
      .filter(
        (registro) =>
          registro.tipo === item.tipo &&
          registro.deputado === item.deputado
      )
      .sort(
        (a, b) =>
          a.cidade.localeCompare(b.cidade, "pt-BR") ||
          a.escola.localeCompare(b.escola, "pt-BR") ||
          a.cargo.localeCompare(b.cargo, "pt-BR") ||
          a.nome.localeCompare(b.nome, "pt-BR")
      );
  }

  function totalDeputados(lista) {
    return lista.reduce((soma, item) => soma + item.total, 0);
  }

  function totalDiretoresDeputados(lista) {
    return lista.reduce((soma, item) => soma + item.diretores, 0);
  }

  function totalAdjuntosDeputados(lista) {
    return lista.reduce((soma, item) => soma + item.adjuntos, 0);
  }

  const baseIndicadores = base();
  const registrosOrdenados = ordenarPorEscola(registros);
  const baseOrdenada = ordenarPorEscola(baseIndicadores);
  const totalFormularios = baseIndicadores.length;
  const totalGestores = baseIndicadores.length * 2;

  function alternarCheckbox(campo, valor) {
    setForm((atual) => {
      const lista = atual[campo] || [];
      return { ...atual, [campo]: lista.includes(valor) ? lista.filter((i) => i !== valor) : [...lista, valor] };
    });
  }

  async function salvarRegistro() {
    if (!form.municipio || !form.escola) {
      alert("Preencha município e escola.");
      return;
    }

    if (editandoId) {
      await updateDoc(doc(db, "reunioes_gestores", editandoId), { ...form, atualizadoEm: new Date().toLocaleString() });
      alert("Formulário atualizado com sucesso!");
    } else {
      await addDoc(collection(db, "reunioes_gestores"), { ...form, criadoEm: new Date().toLocaleString() });
      alert("Reunião salva com sucesso!");
    }

    setForm(formLimpo);
    setEditandoId(null);
    await carregarRegistros();
    setTela("inicio");
  }

  function editarFormulario(registro) {
    setForm({ ...formLimpo, ...registro, demandas: registro.demandas || [], administrativas: registro.administrativas || [] });
    setEditandoId(registro.id);
    setFormAberto(null);
    setFiltroAtivo(null);
    setTela("inicio");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluirRegistro(id) {
    if (!window.confirm("Deseja realmente excluir este formulário?")) return;
    await deleteDoc(doc(db, "reunioes_gestores", id));
    alert("Formulário excluído com sucesso!");
    setFormAberto(null);
    await carregarRegistros();
  }

  function gerarPDF() { window.print(); }

  function imprimirFormulario(registro) {
    setFormAberto(registro);
    setTimeout(() => window.print(), 500);
  }

  function contarClassificacao(tipo) {
    return baseIndicadores.reduce((total, r) => total + (r.classificacaoDiretor === tipo ? 1 : 0) + (r.classificacaoAdjunto === tipo ? 1 : 0), 0);
  }

  function contarEngajamento(tipo) {
    return baseIndicadores.reduce((total, r) => total + (r.interesseAgendaDiretor === tipo ? 1 : 0) + (r.interesseAgendaAdjunto === tipo ? 1 : 0), 0);
  }

  function contarArray(campo, opcao) {
    return baseIndicadores.reduce((total, r) => {
      const lista = Array.isArray(r[campo]) ? r[campo] : [];
      return lista.includes(opcao) ? total + 1 : total;
    }, 0);
  }

  function normalizarPercepcao(valor) {
    const texto = String(valor || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (texto.includes("ressalva")) return "Positivo com ressalvas";
    if (texto.includes("negativ")) return "Negativo";
    if (texto.includes("positiv")) return "Positivo";
    return "";
  }

  function contarPercepcao(campo, opcao) {
    return baseIndicadores.reduce((total, r) => normalizarPercepcao(r[campo]) === opcao ? total + 1 : total, 0);
  }

  const verde = contarClassificacao("VERDE");
  const amarelo = contarClassificacao("AMARELO");
  const vermelho = contarClassificacao("VERMELHO");
  const alto = contarEngajamento("Alto");
  const medio = contarEngajamento("Médio");
  const baixo = contarEngajamento("Baixo");

  // Bases reais dos gráficos: considera somente respostas preenchidas.
  // Isso evita que campos vazios de diretor/adjunto "consumam" percentual.
  const totalClassificados = verde + amarelo + vermelho;
  const totalEngajamento = alto + medio + baixo;

  // Distribui o arredondamento para que categorias mutuamente exclusivas
  // fechem visualmente exatamente em 100%.
  function calcularPercentuais100(valores) {
    const total = valores.reduce((soma, valor) => soma + valor, 0);
    if (!total) return valores.map(() => 0);

    const exatos = valores.map((valor) => (valor / total) * 100);
    const inteiros = exatos.map((valor) => Math.floor(valor));

    let faltam = 100 - inteiros.reduce((soma, valor) => soma + valor, 0);

    const ordem = exatos
      .map((valor, indice) => ({
        indice,
        resto: valor - inteiros[indice]
      }))
      .sort((a, b) => b.resto - a.resto);

    for (let i = 0; i < faltam; i++) {
      inteiros[ordem[i].indice] += 1;
    }

    return inteiros;
  }

  const [percentualVerde, percentualAmarelo, percentualVermelho] =
    calcularPercentuais100([verde, amarelo, vermelho]);

  const [percentualAlto, percentualMedio, percentualBaixo] =
    calcularPercentuais100([alto, medio, baixo]);

  function corIndicador(label) {
    if (label === "VERDE" || label === "Alto" || label === "Positivo") return "#00ff66";
    if (label === "AMARELO" || label === "Médio" || label === "Positivo com ressalvas") return "#ffd400";
    if (label === "VERMELHO" || label === "Baixo" || label === "Negativo") return "#ff3333";
    return "#facc15";
  }

  function listaFiltrada() {
    if (!filtroAtivo) return [];
    const lista = [];

    if (typeof filtroAtivo === "object" && filtroAtivo.tipo === "percepcao") {
      baseIndicadores.forEach((r) => {
        const cargoDiretor = filtroAtivo.campo === "avaliacaoSedDiretor" || filtroAtivo.campo === "avaliacaoGovernoDiretor";
        if (normalizarPercepcao(r[filtroAtivo.campo]) === filtroAtivo.label) {
          lista.push({
            id: `${r.id}-${filtroAtivo.campo}`,
            nome: cargoDiretor ? r.diretor || "Não informado" : r.adjunto || "Não informado",
            cargo: cargoDiretor ? "Diretor(a)" : "Diretor(a) Adjunto(a)",
            municipio: r.municipio,
            escola: r.escola,
            percepcao: r[filtroAtivo.campo] || "Não informado"
          });
        }
      });
      return ordenarPorEscola(lista);
    }

    baseIndicadores.forEach((r) => {
      if (["VERDE", "AMARELO", "VERMELHO"].includes(filtroAtivo)) {
        if (r.classificacaoDiretor === filtroAtivo) lista.push({ id: `${r.id}-d`, nome: r.diretor || "Não informado", cargo: "Diretor(a)", municipio: r.municipio, escola: r.escola, classificacao: r.classificacaoDiretor, engajamento: r.interesseAgendaDiretor });
        if (r.classificacaoAdjunto === filtroAtivo) lista.push({ id: `${r.id}-a`, nome: r.adjunto || "Não informado", cargo: "Diretor(a) Adjunto(a)", municipio: r.municipio, escola: r.escola, classificacao: r.classificacaoAdjunto, engajamento: r.interesseAgendaAdjunto });
      } else {
        if (r.interesseAgendaDiretor === filtroAtivo) lista.push({ id: `${r.id}-ed`, nome: r.diretor || "Não informado", cargo: "Diretor(a)", municipio: r.municipio, escola: r.escola, classificacao: r.classificacaoDiretor, engajamento: r.interesseAgendaDiretor });
        if (r.interesseAgendaAdjunto === filtroAtivo) lista.push({ id: `${r.id}-ea`, nome: r.adjunto || "Não informado", cargo: "Diretor(a) Adjunto(a)", municipio: r.municipio, escola: r.escola, classificacao: r.classificacaoAdjunto, engajamento: r.interesseAgendaAdjunto });
      }
    });

    return ordenarPorEscola(lista);
  }

  function barraVertical(label, valor, totalBase, aoClicar, percentualAjustado = null) {
    const percentual =
      percentualAjustado !== null
        ? percentualAjustado
        : totalBase
          ? Math.round((valor / totalBase) * 100)
          : 0;

    const cor = corIndicador(label);

    return (
      <div style={styles.colunaGrafico} onClick={aoClicar || (() => setFiltroAtivo(label))}>
        <div
          style={{
            ...styles.percentualGrafico,
            color: cor,
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact"
          }}
        >
          {percentual}%
        </div>

        <div style={styles.areaBarraVertical}>
          <div
            style={{
              ...styles.barraVertical,
              height: `${percentual}%`,
              backgroundColor: cor,
              boxShadow: `0 0 18px ${cor}`,
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact"
            }}
          />
        </div>

        <div
          style={{
            ...styles.valorGrafico,
            color: cor,
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact"
          }}
        >
          ({valor})
        </div>

        <div
          style={{
            ...styles.rotuloGrafico,
            color: cor,
            fontSize: label === "Positivo com ressalvas" ? 12 : 15,
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact"
          }}
        >
          {label}
        </div>
      </div>
    );
  }

  function barraHorizontal(label, valor, totalBase) {
    const percentual = totalBase ? Math.round((valor / totalBase) * 100) : 0;
    return (
      <div style={styles.barraHorizontalItem}>
        <div style={styles.barraHorizontalTexto}>
          <span style={{ color: "#ffffff" }}>{label}</span>
          <strong style={{ color: "#ffffff" }}>{valor} ({percentual}%)</strong>
        </div>
        <div style={styles.barraHorizontalFundo}>
          <div style={{ ...styles.barraHorizontalValor, width: `${percentual}%` }} />
        </div>
      </div>
    );
  }

  function graficoCheckbox(titulo, campo, opcoes) {
    return (
      <section style={styles.subPainel}>
        <h3 style={styles.tituloGrafico}>{titulo}</h3>
        {opcoes.map((opcao) => <div key={opcao}>{barraHorizontal(opcao, contarArray(campo, opcao), totalFormularios)}</div>)}
      </section>
    );
  }

  function graficoPercepcao(titulo, campo) {
    const valores = percepcaoOpcoes.map((opcao) => contarPercepcao(campo, opcao));
    const totalRespondidos = valores.reduce((soma, valor) => soma + valor, 0);
    const percentuais = calcularPercentuais100(valores);

    return (
      <section style={styles.subPainel}>
        <h3 style={styles.tituloGrafico}>{titulo}</h3>
        <div style={styles.graficoVertical}>
          {percepcaoOpcoes.map((opcao, indice) =>
            barraVertical(
              opcao,
              valores[indice],
              totalRespondidos,
              () => setFiltroAtivo({ tipo: "percepcao", label: opcao, campo, titulo }),
              percentuais[indice]
            )
          )}
        </div>
      </section>
    );
  }

  function Header() {
    return (
      <header style={styles.header}>
        <div style={styles.logo}>◎</div>
        <div>
          <h1 style={styles.title}>Radar Link MS</h1>
          <p style={styles.subtitle}>Inteligência • Gestão • Articulação Regional</p>
        </div>
      </header>
    );
  }

  function BotoesTopo() {
    return (
      <>
        <button style={styles.button} onClick={() => setTela("relatorio")}>📄 Abrir Relatório Geral / Gerar PDF</button>
        <button style={styles.button} onClick={() => setTela("formularios")}>📂 Acessar Formulários Salvos</button>
        <button style={styles.button} onClick={() => setTela("graficos")}>📊 Acessar Gráficos / Resultados</button>
        <button style={styles.buttonPolitico} onClick={() => setTela("politico")}>🗳️ Cenário Político / Planilha CRE-5</button>
        <button style={styles.buttonSecundario} onClick={sairDaPlataforma}>🚪 Sair da Plataforma</button>
      </>
    );
  }

  function TelaLogin() {
    return (
      <div style={styles.loginPage}>
        <div style={styles.loginBox}>
          <div style={styles.logoGrande}>◎</div>
          <h1 style={styles.loginTitle}>Radar Link MS</h1>
          <p style={styles.loginSubtitle}>Plataforma Estratégica de Gestão Regional</p>
          <input type="password" placeholder="Digite a senha" style={styles.input} value={senhaDigitada}
onChange={(e) => {
  const valor = e.target.value;
  setSenhaDigitada(valor);
}}
autoFocus />
          <button style={styles.button} onClick={entrarNaPlataforma}>🔐 Entrar na Plataforma</button>
        </div>
      </div>
    );
  }

  function TelaFormularioAberto() {
    return (
      <div style={styles.relatorioPage}>
        <h1>Radar Link MS</h1>
        <h2>Formulário salvo</h2>
        <button style={styles.buttonRelatorio} onClick={() => setFormAberto(null)}>Voltar</button>
        <button style={styles.buttonRelatorio} onClick={gerarPDF}>Imprimir / Salvar PDF</button>
        <button style={styles.buttonRelatorio} onClick={() => editarFormulario(formAberto)}>Editar este formulário</button>

        <section style={styles.relatorioBox}>
          <h2>Dados da reunião</h2>
          <p><strong>Município:</strong> {formAberto.municipio}</p>
          <p><strong>Escola:</strong> {formAberto.escola}</p>
          <p><strong>Classificação da Escola:</strong> {formAberto.classificacaoEscola || "Não informada"}</p>
          <p><strong>Data:</strong> {formAberto.data || "Não informada"}</p>
          <p><strong>Diretor(a):</strong> {formAberto.diretor || "Não informado"}</p>
          <p><strong>Diretor(a) Adjunto(a):</strong> {formAberto.adjunto || "Não informado"}</p>
        </section>

        <section style={styles.relatorioBox}>
          <h2>Demandas da escola</h2>
          <p><strong>Marcadas:</strong> {formAberto.demandas?.join(", ") || "Nenhuma"}</p>
          <p><strong>Descrição:</strong> {formAberto.descricaoDemandas || "Sem descrição"}</p>
        </section>

        <section style={styles.relatorioBox}>
          <h2>Questões administrativas</h2>
          <p><strong>Marcadas:</strong> {formAberto.administrativas?.join(", ") || "Nenhuma"}</p>
          <p><strong>Descrição:</strong> {formAberto.descricaoAdministrativas || "Sem descrição"}</p>
        </section>

        <section style={styles.relatorioBox}>
          <h2>Percepção institucional</h2>
          <p><strong>SED - Diretor:</strong> {formAberto.avaliacaoSedDiretor || "Não informado"}</p>
          <p><strong>Governo - Diretor:</strong> {formAberto.avaliacaoGovernoDiretor || "Não informado"}</p>
          <p><strong>SED - Adjunto:</strong> {formAberto.avaliacaoSedAdjunto || "Não informado"}</p>
          <p><strong>Governo - Adjunto:</strong> {formAberto.avaliacaoGovernoAdjunto || "Não informado"}</p>
        </section>

        <section style={styles.relatorioBox}>
          <h2>Engajamento e classificação</h2>
          <p><strong>Engajamento Diretor:</strong> {formAberto.interesseAgendaDiretor || "Não informado"}</p>
          <p><strong>Engajamento Adjunto:</strong> {formAberto.interesseAgendaAdjunto || "Não informado"}</p>
          <p><strong>Classificação Diretor:</strong> {formAberto.classificacaoDiretor || "Não informado"}</p>
          <p><strong>Classificação Adjunto:</strong> {formAberto.classificacaoAdjunto || "Não informado"}</p>
        </section>

        <section style={styles.relatorioBox}>
          <h2>Observações estratégicas</h2>
          <p><strong>Diretor(a):</strong> {formAberto.observacoesDiretor || "Sem observações"}</p>
          <p><strong>Adjunto(a):</strong> {formAberto.observacoesAdjunto || "Sem observações"}</p>
        </section>

        <button style={styles.buttonExcluir} onClick={() => excluirRegistro(formAberto.id)}>Excluir este formulário</button>
      </div>
    );
  }

  function TelaListaFiltro() {
    const lista = listaFiltrada();
    const filtroLabel = typeof filtroAtivo === "object" ? filtroAtivo.label : filtroAtivo;
    const filtroTitulo = typeof filtroAtivo === "object" ? filtroAtivo.titulo : `Lista: ${filtroLabel}`;
    const cor = corIndicador(filtroLabel);

    return (
      <div style={styles.page}>
        <button style={styles.button} onClick={() => setFiltroAtivo(null)}>Voltar</button>
        <h1 style={{ color: cor }}>{filtroTitulo}</h1>
        <h2 style={{ color: cor }}>{filtroLabel}</h2>

        {lista.length === 0 && <p>Nenhum registro encontrado.</p>}

        {lista.map((r) => (
          <div key={r.id} style={{ ...styles.registro, borderLeft: `6px solid ${cor}` }}>
            <h2>{r.nome}</h2>
            <p><strong>Cargo:</strong> {r.cargo}</p>
            <p><strong>Município:</strong> {r.municipio}</p>
            <p><strong>Escola:</strong> {r.escola}</p>
            {r.percepcao && <p><strong>Percepção:</strong> {r.percepcao}</p>}
            {r.classificacao && <p><strong>Classificação:</strong> {r.classificacao}</p>}
            {r.engajamento && <p><strong>Engajamento:</strong> {r.engajamento}</p>}
          </div>
        ))}
      </div>
    );
  }

  function TelaGraficos() {
    return (
      <div style={styles.page}>
        <Header />
        <button style={styles.button} onClick={() => setTela("inicio")}>Voltar ao painel principal</button>
        <button style={styles.button} onClick={gerarPDF}>Imprimir Gráficos / Salvar PDF</button>

        <section style={styles.panel}>
          <h2>Gráficos / Resultados</h2>

          <select style={styles.input} value={municipioIndicador} onChange={(e) => setMunicipioIndicador(e.target.value)}>
            <option value="GERAL">Indicadores gerais</option>
            {Object.keys(escolasPorMunicipio).map((municipio) => <option key={municipio} value={municipio}>{municipio}</option>)}
          </select>

          <h3 style={styles.tituloGrafico}>Classificação</h3>
          <div style={styles.graficoVertical}>
            {barraVertical("VERDE", verde, totalClassificados, null, percentualVerde)}
            {barraVertical("AMARELO", amarelo, totalClassificados, null, percentualAmarelo)}
            {barraVertical("VERMELHO", vermelho, totalClassificados, null, percentualVermelho)}
          </div>

          <h3 style={styles.tituloGrafico}>Engajamento</h3>
          <div style={styles.graficoVertical}>
            {barraVertical("Alto", alto, totalEngajamento, null, percentualAlto)}
            {barraVertical("Médio", medio, totalEngajamento, null, percentualMedio)}
            {barraVertical("Baixo", baixo, totalEngajamento, null, percentualBaixo)}
          </div>

          <h2>Indicadores Demandas</h2>
          {graficoCheckbox("1. Demandas da Escola", "demandas", demandasOpcoes)}
          {graficoCheckbox("2. Questões Administrativas", "administrativas", administrativasOpcoes)}

          <h2>Percepção Institucional</h2>
          {graficoPercepcao("Diretor(a): Como avalia a SED?", "avaliacaoSedDiretor")}
          {graficoPercepcao("Diretor(a): Como avalia o Governo?", "avaliacaoGovernoDiretor")}
          {graficoPercepcao("Diretor(a) Adjunto(a): Como avalia a SED?", "avaliacaoSedAdjunto")}
          {graficoPercepcao("Diretor(a) Adjunto(a): Como avalia o Governo?", "avaliacaoGovernoAdjunto")}
        </section>
      </div>
    );
  }

  function TelaFormularios() {
    return (
      <div style={styles.page}>
        <Header />
        <button style={styles.button} onClick={() => setTela("inicio")}>Voltar ao painel principal</button>
        <button style={styles.button} onClick={gerarPDF}>Imprimir lista / Salvar PDF</button>

        <section style={styles.panel}>
          <h2>Formulários Salvos</h2>
          {registrosOrdenados.length === 0 && <p>Nenhum formulário salvo ainda.</p>}

          {registrosOrdenados.map((r) => (
            <div key={r.id} style={styles.registro}>
              <h3>{r.escola}</h3>
              <p><strong>Município:</strong> {r.municipio}</p>
              <p><strong>Classificação Escola:</strong> {r.classificacaoEscola || "Não informada"}</p>
              <p><strong>Diretor:</strong> {r.diretor || "Não informado"}</p>
              <p><strong>Adjunto:</strong> {r.adjunto || "Não informado"}</p>

              <button style={styles.button} onClick={() => setFormAberto(r)}>Abrir formulário</button>
              <button style={styles.button} onClick={() => editarFormulario(r)}>Editar formulário</button>
              <button style={styles.buttonSecundario} onClick={() => imprimirFormulario(r)}>Imprimir formulário</button>
              <button style={styles.buttonExcluir} onClick={() => excluirRegistro(r.id)}>Excluir</button>
            </div>
          ))}
        </section>
      </div>
    );
  }

  function TelaRelatorio() {
    return (
      <div style={styles.relatorioPage}>
        <h1>Radar Link MS</h1>
        <h2>Relatório Estratégico de Gestores</h2>
        <p><strong>Filtro:</strong> {municipioIndicador === "GERAL" ? "Geral" : municipioIndicador}</p>
        <p><strong>Data de geração:</strong> {new Date().toLocaleString()}</p>

        <button style={styles.buttonRelatorio} onClick={() => setTela("inicio")}>Voltar ao painel</button>
        <button style={styles.buttonRelatorio} onClick={gerarPDF}>Gerar PDF / Imprimir</button>

        <section style={styles.relatorioBox}>
          <h2>1. Totais por Classificação</h2>
          <p><strong>Verde:</strong> {verde}</p>
          <p><strong>Amarelo:</strong> {amarelo}</p>
          <p><strong>Vermelho:</strong> {vermelho}</p>
        </section>

        <section style={styles.relatorioBox}>
          <h2>2. Totais por Engajamento</h2>
          <p><strong>Alto:</strong> {alto}</p>
          <p><strong>Médio:</strong> {medio}</p>
          <p><strong>Baixo:</strong> {baixo}</p>
        </section>

        <section style={styles.relatorioBox}>
          <h2>3. Lista de Diretores</h2>
          {baseOrdenada.map((r) => (
            <div key={`${r.id}-diretor`} style={styles.relatorioItem}>
              <p><strong>Escola:</strong> {r.escola}</p>
              <p><strong>Nome:</strong> {r.diretor || "Não informado"}</p>
              <p><strong>Município:</strong> {r.municipio}</p>
              <p><strong>Classificação Escola:</strong> {r.classificacaoEscola || "Não informada"}</p>
              <p><strong>Classificação:</strong> {r.classificacaoDiretor || "Não informado"}</p>
              <p><strong>Engajamento:</strong> {r.interesseAgendaDiretor || "Não informado"}</p>
              <p><strong>Observações:</strong> {r.observacoesDiretor || "Sem observações"}</p>
            </div>
          ))}
        </section>

        <section style={styles.relatorioBox}>
          <h2>4. Lista de Diretores Adjuntos</h2>
          {baseOrdenada.map((r) => (
            <div key={`${r.id}-adjunto`} style={styles.relatorioItem}>
              <p><strong>Escola:</strong> {r.escola}</p>
              <p><strong>Nome:</strong> {r.adjunto || "Não informado"}</p>
              <p><strong>Município:</strong> {r.municipio}</p>
              <p><strong>Classificação Escola:</strong> {r.classificacaoEscola || "Não informada"}</p>
              <p><strong>Classificação:</strong> {r.classificacaoAdjunto || "Não informado"}</p>
              <p><strong>Engajamento:</strong> {r.interesseAgendaAdjunto || "Não informado"}</p>
              <p><strong>Observações:</strong> {r.observacoesAdjunto || "Sem observações"}</p>
            </div>
          ))}
        </section>

        <section style={styles.relatorioBox}>
          <h2>5. Indicadores Demandas</h2>
          {graficoCheckbox("Demandas da Escola", "demandas", demandasOpcoes)}
          {graficoCheckbox("Questões Administrativas", "administrativas", administrativasOpcoes)}
        </section>

        <section style={styles.relatorioBox}>
          <h2>6. Percepção Institucional</h2>
          {graficoPercepcao("Diretor(a): Como avalia a SED?", "avaliacaoSedDiretor")}
          {graficoPercepcao("Diretor(a): Como avalia o Governo?", "avaliacaoGovernoDiretor")}
          {graficoPercepcao("Diretor(a) Adjunto(a): Como avalia a SED?", "avaliacaoSedAdjunto")}
          {graficoPercepcao("Diretor(a) Adjunto(a): Como avalia o Governo?", "avaliacaoGovernoAdjunto")}
        </section>
      </div>
    );
  }

  function TelaPolitica() {
    function CardDeputado({ item }) {
      return (
        <button
          type="button"
          style={styles.deputadoCard}
          onClick={() => setDetalhePolitico(item)}
          title={`Abrir lista de ${item.deputado}`}
        >
          <div style={styles.deputadoCardTopo}>
            <div>
              <span style={styles.politicoTipo}>{item.tipo}</span>
              <h3 style={styles.deputadoNome}>{item.deputado}</h3>
            </div>
            <strong style={styles.politicoTotal}>{item.total}</strong>
          </div>

          <div style={styles.deputadoContadores}>
            <span>Diretores: <strong>{item.diretores}</strong></span>
            <span>Adjuntos: <strong>{item.adjuntos}</strong></span>
          </div>

          <div style={styles.deputadoAbrir}>Abrir lista completa →</div>
        </button>
      );
    }

    if (detalhePolitico) {
      const registrosApoio = registrosDoDeputado(detalhePolitico);
      const gruposPorCidade = registrosApoio.reduce((mapa, registro) => {
        if (!mapa[registro.cidade]) mapa[registro.cidade] = [];
        mapa[registro.cidade].push(registro);
        return mapa;
      }, {});
      const cidadesOrdenadas = Object.keys(gruposPorCidade).sort((a, b) => a.localeCompare(b, "pt-BR"));

      return (
        <div style={styles.page}>
          <Header />

          <button style={styles.button} onClick={() => setDetalhePolitico(null)}>
            ← Voltar aos deputados
          </button>
          <button style={styles.button} onClick={gerarPDF}>
            Imprimir lista / Salvar PDF
          </button>

          <section style={styles.panel}>
            <span style={styles.politicoTipo}>{detalhePolitico.tipo}</span>
            <h2 style={{ margin: "8px 0 5px 0", fontSize: 30 }}>
              {detalhePolitico.deputado}
            </h2>
            <p style={styles.politicoTexto}>
              Lista do cenário simulado, organizada por município e escola. Clique no telefone para abrir a conversa no WhatsApp.
            </p>

            <div style={styles.politicoKpis}>
              <div style={styles.politicoKpi}>
                <span style={styles.politicoKpiRotulo}>Total</span>
                <strong style={styles.politicoKpiValor}>{detalhePolitico.total}</strong>
              </div>
              <div style={styles.politicoKpi}>
                <span style={styles.politicoKpiRotulo}>Diretores</span>
                <strong style={styles.politicoKpiValor}>{detalhePolitico.diretores}</strong>
              </div>
              <div style={styles.politicoKpi}>
                <span style={styles.politicoKpiRotulo}>Adjuntos</span>
                <strong style={styles.politicoKpiValor}>{detalhePolitico.adjuntos}</strong>
              </div>
              <div style={styles.politicoKpi}>
                <span style={styles.politicoKpiRotulo}>Municípios</span>
                <strong style={styles.politicoKpiValor}>{cidadesOrdenadas.length}</strong>
              </div>
            </div>

            {cidadesOrdenadas.map((cidade) => (
              <section key={cidade} style={styles.apoioCidadeSecao}>
                <div style={styles.apoioCidadeCabecalho}>
                  <h3 style={styles.apoioCidadeTitulo}>{cidade}</h3>
                  <span style={styles.apoioCidadeTotal}>
                    {gruposPorCidade[cidade].length} {gruposPorCidade[cidade].length === 1 ? "gestor" : "gestores"}
                  </span>
                </div>

                <div style={styles.agendaLista}>
                  {gruposPorCidade[cidade].map((registro, indice) => {
                    const link = whatsappLink(registro.telefone);

                    return (
                      <div
                        key={`${registro.tipo}-${registro.deputado}-${registro.cidade}-${registro.escola}-${registro.cargo}-${registro.nome}-${indice}`}
                        style={styles.agendaCard}
                      >
                        <div style={styles.agendaEscola}>{registro.escola}</div>

                        <div style={styles.agendaCargo}>
                          {registro.cargo === "Diretor" ? "DIRETOR(A)" : "DIRETOR(A) ADJUNTO(A)"}
                        </div>
                        <div style={styles.agendaNome}>{registro.nome}</div>

                        {link ? (
                          <a
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            style={styles.whatsappBotao}
                            title={`Abrir WhatsApp de ${registro.nome}`}
                          >
                            💬 {registro.telefone} · WhatsApp
                          </a>
                        ) : (
                          <div style={styles.telefoneSemLink}>
                            Telefone: {registro.telefone && !/^\*+$/.test(registro.telefone) ? registro.telefone : "Não informado"}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

            {registrosApoio.length === 0 && (
              <p>Nenhum registro encontrado para este deputado.</p>
            )}
          </section>
        </div>
      );
    }

    const totalEstaduais = totalDeputados(deputadosEstaduais);
    const totalFederais = totalDeputados(deputadosFederais);

    return (
      <div style={styles.page}>
        <Header />
        <button style={styles.button} onClick={() => setTela("inicio")}>
          Voltar ao painel principal
        </button>
        <button style={styles.button} onClick={gerarPDF}>
          Imprimir painel / Salvar PDF
        </button>

        <section style={styles.panel}>
          <div style={styles.politicoCabecalho}>
            <div>
              <div style={styles.politicoSelo}>CENÁRIO POLÍTICO — SIMULAÇÃO</div>
              <h2 style={{ margin: "8px 0 6px 0" }}>Mapa de Apoios — CRE-5</h2>
              <p style={styles.politicoTexto}>
                Deputados estaduais e federais separados. Cada cartão mostra a quantidade de diretores e adjuntos no cenário.
                Clique no nome do deputado para abrir município, escola, gestor e telefone com acesso direto ao WhatsApp.
              </p>
            </div>
          </div>

          <div style={styles.politicoKpis}>
            <div style={styles.politicoKpi}>
              <span style={styles.politicoKpiRotulo}>Deputados estaduais</span>
              <strong style={styles.politicoKpiValor}>{deputadosEstaduais.length}</strong>
            </div>
            <div style={styles.politicoKpi}>
              <span style={styles.politicoKpiRotulo}>Apoios estaduais</span>
              <strong style={styles.politicoKpiValor}>{totalEstaduais}</strong>
            </div>
            <div style={styles.politicoKpi}>
              <span style={styles.politicoKpiRotulo}>Deputados federais</span>
              <strong style={styles.politicoKpiValor}>{deputadosFederais.length}</strong>
            </div>
            <div style={styles.politicoKpi}>
              <span style={styles.politicoKpiRotulo}>Apoios federais</span>
              <strong style={styles.politicoKpiValor}>{totalFederais}</strong>
            </div>
          </div>

          <div style={styles.blocoDeputados}>
            <div style={styles.blocoDeputadosTitulo}>
              <span style={styles.deputadoIcone}>🏛️</span>
              <div>
                <h2 style={{ margin: 0 }}>Deputados Estaduais</h2>
                <div style={styles.politicoTexto}>
                  Diretores: {totalDiretoresDeputados(deputadosEstaduais)} · Adjuntos: {totalAdjuntosDeputados(deputadosEstaduais)}
                </div>
              </div>
            </div>

            <div style={styles.deputadosGrid}>
              {deputadosEstaduais.map((item) => (
                <CardDeputado key={`EST-${item.deputado}`} item={item} />
              ))}
            </div>
          </div>

          <div style={styles.blocoDeputados}>
            <div style={styles.blocoDeputadosTitulo}>
              <span style={styles.deputadoIcone}>🇧🇷</span>
              <div>
                <h2 style={{ margin: 0 }}>Deputados Federais</h2>
                <div style={styles.politicoTexto}>
                  Diretores: {totalDiretoresDeputados(deputadosFederais)} · Adjuntos: {totalAdjuntosDeputados(deputadosFederais)}
                </div>
              </div>
            </div>

            <div style={styles.deputadosGrid}>
              {deputadosFederais.map((item) => (
                <CardDeputado key={`FED-${item.deputado}`} item={item} />
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  function TelaInicio() {
    return (
      <div style={styles.page}>
        <Header />
        <BotoesTopo />

        <main style={styles.grid}>
          <section style={styles.panel}>
            <h2>Formulário de Reunião com Gestores</h2>

            {editandoId && <div style={styles.avisoEdicao}>Editando formulário salvo</div>}

            <select style={styles.input} value={form.municipio} onChange={(e) => setForm({ ...form, municipio: e.target.value, escola: "" })}>
              <option value="">Selecione o município</option>
              {Object.keys(escolasPorMunicipio).map((municipio) => <option key={municipio}>{municipio}</option>)}
            </select>

            <select style={styles.input} value={form.escola} onChange={(e) => setForm({ ...form, escola: e.target.value })}>
              <option value="">Selecione a escola</option>
              {form.municipio && escolasPorMunicipio[form.municipio]?.map((escola) => <option key={escola}>{escola}</option>)}
            </select>

            <select style={styles.input} value={form.classificacaoEscola} onChange={(e) => setForm({ ...form, classificacaoEscola: e.target.value })}>
              <option value="">Classificação da Escola</option>
              <option>1</option><option>2</option><option>3</option><option>4</option>
            </select>

            <input style={styles.input} type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            <input style={styles.input} placeholder="Diretor(a)" value={form.diretor} onChange={(e) => setForm({ ...form, diretor: e.target.value })} />
            <input style={styles.input} placeholder="Diretor(a) Adjunto(a)" value={form.adjunto} onChange={(e) => setForm({ ...form, adjunto: e.target.value })} />

            <h3>1. Demandas da Escola</h3>
            {demandasOpcoes.map((opcao) => (
              <label style={styles.check} key={opcao}>
                <input type="checkbox" checked={form.demandas.includes(opcao)} onChange={() => alternarCheckbox("demandas", opcao)} /> {opcao}
              </label>
            ))}
            <textarea style={styles.textarea} placeholder="Descrição das demandas" value={form.descricaoDemandas} onChange={(e) => setForm({ ...form, descricaoDemandas: e.target.value })} />

            <h3>2. Questões Administrativas</h3>
            {administrativasOpcoes.map((opcao) => (
              <label style={styles.check} key={opcao}>
                <input type="checkbox" checked={form.administrativas.includes(opcao)} onChange={() => alternarCheckbox("administrativas", opcao)} /> {opcao}
              </label>
            ))}
            <textarea style={styles.textarea} placeholder="Descrição das questões administrativas" value={form.descricaoAdministrativas} onChange={(e) => setForm({ ...form, descricaoAdministrativas: e.target.value })} />

            <h3>3. Percepção Institucional</h3>
            {[
              ["Diretor(a): Como avalia a SED?", "avaliacaoSedDiretor"],
              ["Diretor(a): Como avalia o Governo?", "avaliacaoGovernoDiretor"],
              ["Diretor(a) Adjunto(a): Como avalia a SED?", "avaliacaoSedAdjunto"],
              ["Diretor(a) Adjunto(a): Como avalia o Governo?", "avaliacaoGovernoAdjunto"]
            ].map(([titulo, campo]) => (
              <div key={campo}>
                <h4>{titulo}</h4>
                <select style={styles.input} value={form[campo]} onChange={(e) => setForm({ ...form, [campo]: e.target.value })}>
                  <option value="">Selecione</option>
                  {percepcaoOpcoes.map((opcao) => <option key={opcao}>{opcao}</option>)}
                </select>
              </div>
            ))}

            <h3>4. Engajamento</h3>
            <select style={styles.input} value={form.interesseAgendaDiretor} onChange={(e) => setForm({ ...form, interesseAgendaDiretor: e.target.value })}>
              <option value="">Interesse Diretor</option><option>Alto</option><option>Médio</option><option>Baixo</option>
            </select>
            <select style={styles.input} value={form.interesseAgendaAdjunto} onChange={(e) => setForm({ ...form, interesseAgendaAdjunto: e.target.value })}>
              <option value="">Interesse Adjunto</option><option>Alto</option><option>Médio</option><option>Baixo</option>
            </select>

            <h3>5. Classificação Interna</h3>
            <select style={styles.input} value={form.classificacaoDiretor} onChange={(e) => setForm({ ...form, classificacaoDiretor: e.target.value })}>
              <option value="">Classificação Diretor</option><option>VERDE</option><option>AMARELO</option><option>VERMELHO</option>
            </select>
            <select style={styles.input} value={form.classificacaoAdjunto} onChange={(e) => setForm({ ...form, classificacaoAdjunto: e.target.value })}>
              <option value="">Classificação Adjunto</option><option>VERDE</option><option>AMARELO</option><option>VERMELHO</option>
            </select>

            <h3>6. Observações Estratégicas</h3>
            <h4>Diretor(a)</h4>
            <textarea style={styles.textarea} placeholder="Observações estratégicas do Diretor(a)" value={form.observacoesDiretor} onChange={(e) => setForm({ ...form, observacoesDiretor: e.target.value })} />
            <h4>Diretor(a) Adjunto(a)</h4>
            <textarea style={styles.textarea} placeholder="Observações estratégicas do Adjunto(a)" value={form.observacoesAdjunto} onChange={(e) => setForm({ ...form, observacoesAdjunto: e.target.value })} />

            <button style={styles.button} onClick={salvarRegistro}>{editandoId ? "Salvar Alterações" : "Salvar Reunião"}</button>
            {editandoId && <button style={styles.buttonSecundario} onClick={() => { setForm(formLimpo); setEditandoId(null); }}>Cancelar edição</button>}
          </section>
        </main>
      </div>
    );
  }

  if (!autenticado) return <TelaLogin />;
  if (formAberto) return <TelaFormularioAberto />;
  if (filtroAtivo) return <TelaListaFiltro />;
  if (tela === "formularios") return <TelaFormularios />;
  if (tela === "graficos") return <TelaGraficos />;
  if (tela === "politico") return <TelaPolitica />;
  if (tela === "relatorio") return <TelaRelatorio />;
  return <TelaInicio />;
}

const styles = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg,#07111f,#0f172a,#111827)", color: "white", fontFamily: "Arial", padding: 15, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" },
  loginPage: { minHeight: "100vh", background: "linear-gradient(135deg,#020617,#0f172a,#1e293b)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "Arial" },
  loginBox: { width: "100%", maxWidth: 420, background: "rgba(15,23,42,.96)", padding: 30, borderRadius: 22, boxShadow: "0 20px 60px rgba(0,0,0,.45)", color: "white", textAlign: "center" },
  logoGrande: { width: 75, height: 75, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#facc15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, margin: "0 auto 15px auto" },
  loginTitle: { margin: 0, fontSize: 34 },
  loginSubtitle: { color: "#cbd5e1", marginBottom: 25 },
  header: { display: "flex", alignItems: "center", gap: 15, marginBottom: 25, flexWrap: "wrap" },
  logo: { width: 55, height: 55, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#facc15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 },
  title: { margin: 0, fontSize: "clamp(26px, 5vw, 38px)" },
  subtitle: { margin: 0, color: "#cbd5e1" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 20 },
  panel: { background: "rgba(15,23,42,.95)", padding: 20, borderRadius: 18, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" },
  subPainel: { background: "#0f172a", padding: 14, borderRadius: 12, marginBottom: 18, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" },
  tituloGrafico: { textAlign: "center", fontSize: 20, fontWeight: "900", marginBottom: 10, color: "#ffffff" },
  input: { width: "100%", padding: 13, marginBottom: 10, borderRadius: 8, border: "none", boxSizing: "border-box", fontSize: 16 },
  textarea: { width: "100%", padding: 13, marginBottom: 10, borderRadius: 8, border: "none", minHeight: 90, boxSizing: "border-box", fontSize: 16 },
  check: { display: "block", marginBottom: 8 },
  button: { width: "100%", padding: 14, background: "#2563eb", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold", marginBottom: 10 },
  buttonSecundario: { width: "100%", padding: 14, background: "#475569", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold", marginBottom: 10 },
  buttonExcluir: { width: "100%", padding: 14, background: "#ef4444", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: "bold" },
  avisoEdicao: { background: "#eab308", color: "#111827", padding: 12, borderRadius: 10, fontWeight: "bold", marginBottom: 12 },
  graficoVertical: { display: "flex", justifyContent: "space-evenly", alignItems: "flex-start", gap: 50, minHeight: 460, marginBottom: 60, paddingTop: 35, paddingBottom: 25, overflowX: "auto" },
  colunaGrafico: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", cursor: "pointer", width: 120, gap: 12, flexShrink: 0, minHeight: 410 },
  areaBarraVertical: { height: 280, width: 65, background: "#334155", borderRadius: 14, display: "flex", alignItems: "flex-end", overflow: "hidden", border: "1px solid #475569", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" },
  barraVertical: { width: "100%", borderRadius: 14, transition: "0.4s", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" },
  percentualGrafico: { height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: "900", lineHeight: "24px", marginBottom: 4 },
  valorGrafico: { height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: "900", lineHeight: "26px", marginTop: 4 },
  rotuloGrafico: { minHeight: 42, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontWeight: "900", lineHeight: "16px", marginTop: 2 },
  barraHorizontalItem: { marginBottom: 12 },
  barraHorizontalTexto: { display: "flex", justifyContent: "space-between", gap: 10, fontWeight: "bold", marginBottom: 5, color: "#ffffff" },
  barraHorizontalFundo: { height: 14, background: "#334155", borderRadius: 999, overflow: "hidden", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" },
  barraHorizontalValor: { height: 14, borderRadius: 999, transition: "0.3s", background: "#facc15", boxShadow: "0 0 12px rgba(250,204,21,0.55)", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" },
  registro: { background: "#1e293b", padding: 18, borderRadius: 14, marginBottom: 15 },
  relatorioPage: { background: "white", color: "black", minHeight: "100vh", padding: 30, fontFamily: "Arial", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" },
  relatorioBox: { border: "1px solid #ccc", padding: 15, borderRadius: 10, marginBottom: 20 },
  relatorioItem: { borderBottom: "1px solid #ddd", padding: "10px 0" },
  buttonRelatorio: { padding: 12, background: "#2563eb", color: "white", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", marginRight: 10, marginBottom: 10 },
  buttonPolitico: { width: "100%", padding: 14, background: "linear-gradient(90deg,#7c3aed,#4f46e5)", color: "white", border: "1px solid rgba(255,255,255,.14)", borderRadius: 10, cursor: "pointer", fontWeight: "bold", marginBottom: 10, boxShadow: "0 8px 24px rgba(79,70,229,.22)" },
  politicoCabecalho: { display: "flex", justifyContent: "space-between", gap: 20, alignItems: "flex-start", flexWrap: "wrap", paddingBottom: 8 },
  politicoSelo: { display: "inline-block", background: "#7c3aed", color: "#ffffff", padding: "5px 9px", borderRadius: 999, fontSize: 11, fontWeight: "900", letterSpacing: ".7px" },
  politicoTexto: { color: "#cbd5e1", lineHeight: 1.55, marginTop: 4 },
  politicoFiltros: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 12, marginTop: 18 },
  politicoKpis: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginTop: 12 },
  politicoKpi: { background: "#111c31", border: "1px solid #26344d", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 7 },
  politicoKpiRotulo: { color: "#94a3b8", fontSize: 13, fontWeight: "700" },
  politicoKpiValor: { color: "#ffffff", fontSize: 30, lineHeight: 1 },
  politicoLista: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 },
  politicoCard: { background: "#101a2d", border: "1px solid #29364d", borderRadius: 15, padding: 16, WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" },
  politicoCardTopo: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  politicoTipo: { color: "#a5b4fc", textTransform: "uppercase", fontSize: 11, fontWeight: "900", letterSpacing: ".8px" },
  politicoTotal: { minWidth: 44, height: 44, borderRadius: 12, background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 },
  politicoBarraFundo: { width: "100%", height: 9, background: "#334155", borderRadius: 999, overflow: "hidden", marginTop: 16 },
  politicoBarraValor: { height: "100%", background: "linear-gradient(90deg,#818cf8,#c084fc)", borderRadius: 999 },
  politicoDetalhes: { display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginTop: 12, color: "#cbd5e1", fontSize: 13 },
  politicoDetalheBotao: { flex: "1 1 120px", background: "#172033", color: "#e2e8f0", border: "1px solid #334155", borderRadius: 9, padding: "9px 10px", cursor: "pointer", fontSize: 13, textAlign: "left" },
  politicoMunicipios: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 },
  politicoMunicipioCard: { background: "#172033", borderLeft: "4px solid #8b5cf6", padding: 14, borderRadius: 12, display: "flex", flexDirection: "column", gap: 7, color: "#cbd5e1" },
  politicoMunicipioBotao: { width: "100%", borderTop: "none", borderRight: "none", borderBottom: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit" },
  politicoMunicipioLink: { color: "#c4b5fd", fontSize: 12, fontWeight: "800", marginTop: 3 },
  politicoAviso: { background: "#172033", border: "1px solid #334155", padding: 14, borderRadius: 12, color: "#cbd5e1", marginTop: 14 },
  gestoresMunicipioLista: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12, marginTop: 18 },
  gestorMunicipioCard: { background: "#101a2d", border: "1px solid #29364d", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 10 },
  gestorMunicipioEscola: { color: "#ffffff", fontWeight: "900", fontSize: 16, paddingBottom: 9, borderBottom: "1px solid #29364d" },
  gestorMunicipioLinha: { display: "grid", gridTemplateColumns: "95px 1fr", gap: 10, alignItems: "start", color: "#e2e8f0" },
  gestorMunicipioCargo: { color: "#a5b4fc", fontSize: 12, fontWeight: "900", textTransform: "uppercase" },
  gestorMunicipioMunicipio: { color: "#94a3b8", fontSize: 12, fontWeight: "700", marginTop: 2 },
  blocoDeputados: { marginTop: 30, paddingTop: 8 },
  blocoDeputadosTitulo: { display: "flex", alignItems: "center", gap: 12, paddingBottom: 14, borderBottom: "1px solid #29364d", marginBottom: 16 },
  deputadoIcone: { fontSize: 30 },
  deputadosGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 14 },
  deputadoCard: { background: "#101a2d", color: "#ffffff", border: "1px solid #29364d", borderRadius: 15, padding: 16, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "transform .15s ease, border-color .15s ease", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" },
  deputadoCardTopo: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  deputadoNome: { margin: "6px 0 0 0", fontSize: 20, color: "#ffffff" },
  deputadoContadores: { display: "flex", justifyContent: "space-between", gap: 12, marginTop: 16, color: "#dbeafe", fontSize: 14, flexWrap: "wrap" },
  deputadoAbrir: { color: "#c4b5fd", fontSize: 12, fontWeight: "800", marginTop: 14, paddingTop: 12, borderTop: "1px solid #29364d" },
  agendaLista: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14, marginTop: 18 },
  agendaCard: { background: "#101a2d", border: "1px solid #29364d", borderRadius: 15, padding: 16, display: "flex", flexDirection: "column", gap: 8 },
  agendaCidade: { color: "#a5b4fc", fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: ".5px" },
  agendaEscola: { color: "#ffffff", fontSize: 15, fontWeight: "800", paddingBottom: 9, borderBottom: "1px solid #29364d" },
  agendaCargo: { color: "#94a3b8", fontSize: 12, fontWeight: "800", textTransform: "uppercase", marginTop: 3 },
  agendaNome: { color: "#ffffff", fontSize: 17, fontWeight: "900" },
  whatsappBotao: { display: "block", background: "#166534", color: "#ffffff", textDecoration: "none", padding: "11px 12px", borderRadius: 9, fontWeight: "800", marginTop: 5, textAlign: "center" },
  telefoneSemLink: { background: "#172033", color: "#94a3b8", padding: "10px 12px", borderRadius: 9, marginTop: 5 }
,
  apoioCidadeSecao: { marginTop: 28, paddingTop: 18, borderTop: "1px solid #29364d" },
  apoioCidadeCabecalho: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 },
  apoioCidadeTitulo: { margin: 0, color: "#ffffff", fontSize: 22 },
  apoioCidadeTotal: { display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#4f46e5", color: "#ffffff", borderRadius: 999, padding: "6px 11px", fontSize: 12, fontWeight: "900" }
};