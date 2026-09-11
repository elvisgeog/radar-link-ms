import React, { useEffect, useMemo, useState } from "react";
import { collection, addDoc, getDocs, deleteDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

// ============================================================
// RADAR LINK MS — BASE POLÍTICA
// Atualizada a partir dos dois documentos Word anexados.
// IMPORTANTE: a classificação Estadual/Federal segue o CABEÇALHO
// INTERNO das planilhas Word, não o nome do arquivo.
// ============================================================
const gestoresPoliticosBase = [
  {
    "cidade": "CAARAPÓ",
    "escola": "EE Arcênio Rojas",
    "cargo": "Diretor",
    "nome": "Solon Rodrigues Lima",
    "telefone": "(67)9.9876- 8613",
    "estadual": "Marcelo Miranda",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "CAARAPÓ",
    "escola": "EE Frei João Damasceno",
    "cargo": "Diretor",
    "nome": "Nei Geller",
    "telefone": "(67)9.927-2396",
    "estadual": "Marcelo Miranda",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "CAARAPÓ",
    "escola": "EE Indígena EM “Yvy Poty”.",
    "cargo": "Diretor",
    "nome": "Valdinei Marques Mendonça",
    "telefone": "(67)9.9642-9814",
    "estadual": "Marcelo Miranda",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "CAARAPÓ",
    "escola": "EE Padre José de Anchieta",
    "cargo": "Diretor",
    "nome": "Eduardo Bonfa",
    "telefone": "(67)99921-9887",
    "estadual": "Zé Teixeira",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "CAARAPÓ",
    "escola": "EE Prof.ª Cleuza Aparecida V. Galhardo",
    "cargo": "Diretor",
    "nome": "Nilza Elena Zambão",
    "telefone": "(67) 9.9912 4658",
    "estadual": "Marcelo Miranda",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "CAARAPÓ",
    "escola": "EE Tenente Aviador Antonio João",
    "cargo": "Diretor",
    "nome": "Jane Lins",
    "telefone": "(67) 9.96299359",
    "estadual": "Marcelo Miranda",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "CAARAPÓ",
    "escola": "EE Prof. Joaquim Alfredo Soares Vianna",
    "cargo": "Diretor",
    "nome": "Luis Carlos de Andrade",
    "telefone": "(67) 9.9870-6396",
    "estadual": "Londres Machado",
    "federal": "Dagoberto"
  },
  {
    "cidade": "DEODÁPOLIS",
    "escola": "EE 13 de Maio",
    "cargo": "Diretor",
    "nome": "Vagna Dias de Azevedo Lourenço",
    "telefone": "(67) 9.9337-3468",
    "estadual": "Marcelo Miranda",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "DEODÁPOLIS",
    "escola": "EE João Baptista Pereira",
    "cargo": "Diretor",
    "nome": "Jean Carlos da Silva",
    "telefone": "(67) 9.9987-1905",
    "estadual": "Renato Câmara",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "DEODÁPOLIS",
    "escola": "EE Lagoa Bonita",
    "cargo": "Diretor",
    "nome": "Sara Livino de Jesus",
    "telefone": "(67) 9.9909-9255",
    "estadual": "Zé Teixeira",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "DEODÁPOLIS",
    "escola": "EE Porto Vilma",
    "cargo": "Diretor",
    "nome": "Givaldo Santos Oliveira",
    "telefone": "(67) 9.9681-9470",
    "estadual": "Londres Machado",
    "federal": "Dagoberto"
  },
  {
    "cidade": "DEODÁPOLIS",
    "escola": "EE Scila Médici",
    "cargo": "Diretor",
    "nome": "Evandro Sérgio de Souza Goncales",
    "telefone": "(67) 9.9901-1977",
    "estadual": "Renato Câmara",
    "federal": "Beto Pereira"
  },
  {
    "cidade": "DOURADINA",
    "escola": "EE Barão do Rio Branco",
    "cargo": "Diretor",
    "nome": "Janaina Spessoto Sais",
    "telefone": "(67) 9.9988-5457",
    "estadual": "Lia Nogueira",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "DOURADOS",
    "escola": "CEEJA-de Dourados",
    "cargo": "Diretor",
    "nome": "Daniela Meili Staut",
    "telefone": "(67) 9.9234-0364",
    "estadual": "Zé Teixeira",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "DOURADOS",
    "escola": "Centro Estadual de Educação Profissional \"Profª. Evanilde Costa da Silva\"",
    "cargo": "Diretor",
    "nome": "Alini Aparecida de Lima Nolasco",
    "telefone": "(67) 9.9648-7577",
    "estadual": "Marcelo Miranda",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Abigail Borralho",
    "cargo": "Diretor",
    "nome": "Ramao Agedo Vieira",
    "telefone": "(67) 9.9832-2754",
    "estadual": "Renato Câmara",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Antônia da Silveira Capilé",
    "cargo": "Diretor",
    "nome": "João Henrique B. de Godoy Filho",
    "telefone": "(67) 9.9935-1566",
    "estadual": "Lia Nogueira",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Antônio Vicente Azambuja",
    "cargo": "Diretor",
    "nome": "Maria José Lins",
    "telefone": "(67) 9.9977-9663",
    "estadual": "Zé Teixeira",
    "federal": "Geraldo Resende"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Castro Alves",
    "cargo": "Diretor",
    "nome": "Márcia Regina da Silva Wider",
    "telefone": "(67) 9846-0877",
    "estadual": "Zé Teixeira",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Floriano Viegas Machado",
    "cargo": "Diretor",
    "nome": "Julio Cezar dos Santos",
    "telefone": "(67) 9601-1845",
    "estadual": "Renato Câmara",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Joaquim Vaz de Oliveira",
    "cargo": "Diretor",
    "nome": "Rosineia Rodrigues Moreno",
    "telefone": "(67) 9941-2810",
    "estadual": "Pedrossian Neto",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Indígena de EM Intercultural Guateka – Marçal de Souza",
    "cargo": "Diretor",
    "nome": "Luiz de Souza Freire Junior",
    "telefone": "(67) 9.9861-1414",
    "estadual": "Lia Nogueira",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Maria da Glória Muzzi Ferreira",
    "cargo": "Diretor",
    "nome": "Pascolalino Cornelia Angelico",
    "telefone": "(67) 9920-0963",
    "estadual": "",
    "federal": ""
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Menodora Fialho de Figueiredo",
    "cargo": "Diretor",
    "nome": "Aline Midori Takahara",
    "telefone": "(67) 9.8162-0169",
    "estadual": "Renato Câmara",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Min. João Paulo dos Reis Veloso",
    "cargo": "Diretor",
    "nome": "José Carlos Severiano de Souza",
    "telefone": "(67) 9.9257-3603",
    "estadual": "Renato Câmara",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Pastor Daniel Berg",
    "cargo": "Diretor",
    "nome": "Lisiane dos Santos Borella",
    "telefone": "(67) 9.9686-0798",
    "estadual": "Lia Nogueira",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Presidente Getulio Vargas",
    "cargo": "Diretor",
    "nome": "José Antônio do Nascimento Junior",
    "telefone": "(67) 9.9914-7374",
    "estadual": "Lia Nogueira",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Presidente Tancredo Neves",
    "cargo": "Diretor",
    "nome": "Alcides Peres Junior",
    "telefone": "(67) 9. 9945-6998",
    "estadual": "Lia Nogueira",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Presidente Vargas",
    "cargo": "Diretor",
    "nome": "Fernando Fernandes Rodrigues",
    "telefone": "(67) 9.9651-6327",
    "estadual": "Pedrossian Neto",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Prof. Alício Araújo",
    "cargo": "Diretor",
    "nome": "Marcos Falco de Lima",
    "telefone": "(67) 9.9987 1805",
    "estadual": "Oposição",
    "federal": "Oposição"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Prof. Celso Müller do Amaral",
    "cargo": "Diretor",
    "nome": "Wagner José de Souza",
    "telefone": "(67) 9.9227-6172",
    "estadual": "Lia Nogueira",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Prof. José Pereira Lins",
    "cargo": "Diretor",
    "nome": "Sandra Saldivar Oviedo da Silva",
    "telefone": "(67) 9.9695 4221",
    "estadual": "Zé Teixeira",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Prof.ª Floriana Lopes",
    "cargo": "Diretor",
    "nome": "Arlei Menguer de Castilhos",
    "telefone": "(67) 9.9904-3069",
    "estadual": "Lia Nogueira",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Ramona da Silva Pedroso",
    "cargo": "Diretor",
    "nome": "Fabio Almeida e Silva",
    "telefone": "(67) 9.9965-9806",
    "estadual": "Zé Teixeira",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Rita Angelina Barbosa Silveira",
    "cargo": "Diretor",
    "nome": "Tarsila Bibiane Lima Ramos",
    "telefone": "(67) 9.9617-5195",
    "estadual": "Renato Câmara",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Vilmar Vieira Matos",
    "cargo": "Diretor",
    "nome": "Ivan Ferreira Pereira",
    "telefone": "(67) 9.9657-1131",
    "estadual": "Lia Nogueira",
    "federal": ""
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Vereador Moacir Djalma Barros",
    "cargo": "Diretor",
    "nome": "Regina Rozania Lima de Araújo",
    "telefone": "(67) 9999-9910",
    "estadual": "Pedrossian Neto",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "FÁTIMA DO SUL",
    "escola": "EE Jonas Belarmino da Silva",
    "cargo": "Diretor",
    "nome": "Sidnei Ferreira Rocha",
    "telefone": "(67) 9.9644-7540",
    "estadual": "Londres Machado",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "FÁTIMA DO SUL",
    "escola": "EE Senador Filinto Müller",
    "cargo": "Diretor",
    "nome": "Altair Vieira de Albuquerque",
    "telefone": "(67) 9.9974-1718",
    "estadual": "Londres Machado",
    "federal": "Beto Pereira"
  },
  {
    "cidade": "FÁTIMA DO SUL",
    "escola": "EE Vicente Pallotti",
    "cargo": "Diretor",
    "nome": "Gislaine Cristina dos Santos N. Rocha",
    "telefone": "(67) 9.9808-1825",
    "estadual": "Londres Machado",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "FÁTIMA DO SUL",
    "escola": "EE Vila Brasil",
    "cargo": "Diretor",
    "nome": "Caique Bento Casotti",
    "telefone": "(67)9.9631-7097",
    "estadual": "Londres Machado",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "GLÓRIA DE DOURADOS",
    "escola": "EE Prof.ª Eufrosina Pinto",
    "cargo": "Diretor",
    "nome": "Marcio Renato Gomes",
    "telefone": "(67) 9.9963-4896",
    "estadual": "Marcelo Miranda",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "GLÓRIA DE DOURADOS",
    "escola": "EE Prof.ª Vânia Medeiros Lopes",
    "cargo": "Diretor",
    "nome": "Maria Eliete dos Santos de Matos",
    "telefone": "(67) 9.9920-4943",
    "estadual": "Marcelo Miranda",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "GLÓRIA DE DOURADOS",
    "escola": "EE Weimar Torres",
    "cargo": "Diretor",
    "nome": "Eliane Milane e Silva Rodrigues",
    "telefone": "(67) 9.9663-6459",
    "estadual": "Renato Câmara",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "ITAPORÃ",
    "escola": "EE Rodrigues Alves",
    "cargo": "Diretor",
    "nome": "Célia Regina Frota Boni",
    "telefone": "(67) 9.9648-8299",
    "estadual": "Jamilson",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "ITAPORÃ",
    "escola": "EE Olívia Paula",
    "cargo": "Diretor",
    "nome": "Maria de Lourdes Targino de Oliveira",
    "telefone": "(67) 9.9931-0104",
    "estadual": "Lia Nogueira",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "ITAPORÃ",
    "escola": "EE Edson Bezerra",
    "cargo": "Diretor",
    "nome": "Elaine Cleia Leite",
    "telefone": "(67)9 9973-5251",
    "estadual": "Zé Teixeira",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "ITAPORÃ",
    "escola": "EE Senador Saldanha Derzi",
    "cargo": "Diretor",
    "nome": "Jane Mara Martins Correia Simplício",
    "telefone": "(67) 9.9962-5133",
    "estadual": "Renato Câmara",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "ITAPORÃ",
    "escola": "EE Antonio João Ribeiro",
    "cargo": "Diretor",
    "nome": "Lislaine Borges dos Santos Tino",
    "telefone": "(67) 9.9608-6175",
    "estadual": "Jamilson",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "ITAPORÃ",
    "escola": "EE Princesa Izabel",
    "cargo": "Diretor",
    "nome": "Rosenir Salete Endres",
    "telefone": "(67) 9.9653-4135",
    "estadual": "Marcelo Miranda",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "JATEÍ",
    "escola": "EE Prof. Joaquim Alfredo Soares Vianna",
    "cargo": "Diretor",
    "nome": "Robson Assunção dos Santos",
    "telefone": "(67) 9.9927-6072",
    "estadual": "Zé Teixeira",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "JATEÍ",
    "escola": "EE Prof.ª Bernadete dos Santos Leite",
    "cargo": "Diretor",
    "nome": "Andréa de Souza Silva",
    "telefone": "(67) 9.9633-4463",
    "estadual": "Zé Teixeira",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "LAGUNA CARAPÃ",
    "escola": "EE Álvaro Martins dos Santos",
    "cargo": "Diretor",
    "nome": "Mauro Sergio Almeida de Lima",
    "telefone": "(67) 9.9617-8788",
    "estadual": "Zé Teixeira",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "MARACAJU",
    "escola": "EE Cambarai",
    "cargo": "Diretor",
    "nome": "Katiane Silva de Souza",
    "telefone": "(67) 9.8422-4228",
    "estadual": "Hélio Peluffo",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "MARACAJU",
    "escola": "EE Cívico-Militar Coronel Lima de Figueiredo",
    "cargo": "Diretor",
    "nome": "Cleber Vanderlei Pinto Colpo",
    "telefone": "(67) 9.9941-3873",
    "estadual": "Paulo Correa",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "MARACAJU",
    "escola": "EE Manoel Ferreira de Lima",
    "cargo": "Diretor",
    "nome": "Erenil Martins Cardoso",
    "telefone": "(67) 9.8418-4251",
    "estadual": "Pedrossian Neto",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "MARACAJU",
    "escola": "EE Pe. Constantino de Monte",
    "cargo": "Diretor",
    "nome": "Arlon Cossetin Branco",
    "telefone": "(67) 9.9636-9692",
    "estadual": "Renato Câmara",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "RIO BRILHANTE",
    "escola": "EE Profª. Ligia Terezinha Martins",
    "cargo": "Diretor",
    "nome": "Lucimara Faustino Barbosa Cattani",
    "telefone": "(67) 9.9973-4348",
    "estadual": "Marcelo Miranda",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "RIO BRILHANTE",
    "escola": "EE Etalívio Pereira Martins",
    "cargo": "Diretor",
    "nome": "Vagner Caceres Soares",
    "telefone": "(67) 9.9882-8014",
    "estadual": "Marcelo Miranda",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "RIO BRILHANTE",
    "escola": "EE Fernando Corrêa da Costa",
    "cargo": "Diretor",
    "nome": "Mario Cesar Furlan",
    "telefone": "(67) 9.9978-4215",
    "estadual": "Lia Nogueira",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "VICENTINA",
    "escola": "EE Emannuel Pinheiro",
    "cargo": "Diretor",
    "nome": "Maria Divaldete Mello de Almeida",
    "telefone": "(67) 9.9642-8295",
    "estadual": "Marcelo Miranda",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "VICENTINA",
    "escola": "EE Padre José Daniel",
    "cargo": "Diretor",
    "nome": "José André de Alcantara",
    "telefone": "(67) 9.921-3657",
    "estadual": "Londres Machado",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "VICENTINA",
    "escola": "EE São José",
    "cargo": "Diretor",
    "nome": "Claudia Regina de O. e Silva Souza",
    "telefone": "(67) 9.9643-4014",
    "estadual": "Renato Câmara",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "CAARAPÓ",
    "escola": "EE Frei João Damasceno",
    "cargo": "Adjunto",
    "nome": "Fernanda Venacio da Silva",
    "telefone": "(67) 9.9930-2701",
    "estadual": "Marcelo Miranda",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "CAARAPÓ",
    "escola": "EE Indígena EM “Yvy Poty”.",
    "cargo": "Adjunto",
    "nome": "Cristiani da Silva Rocha",
    "telefone": "(67)9.9840-3698",
    "estadual": "Marcelo Miranda",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "CAARAPÓ",
    "escola": "EE Prof.ª Cleuza Aparecida V. Galhardo",
    "cargo": "Adjunto",
    "nome": "Andréa Menegatti Recalde",
    "telefone": "(67)9.9876-7630",
    "estadual": "Marcelo Miranda",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "CAARAPÓ",
    "escola": "EE Prof. Joaquim Alfredo Soares Vianna",
    "cargo": "Adjunto",
    "nome": "Michael Pereira de Souza",
    "telefone": "(67)9.9603-5268",
    "estadual": "Oposição",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "DEODÁPOLIS",
    "escola": "EE 13 de Maio",
    "cargo": "Adjunto",
    "nome": "Tiago Henrique Rodrigues da Silva",
    "telefone": "(67) 9.9984-4611",
    "estadual": "Renato Câmara",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "DEODÁPOLIS",
    "escola": "EE Porto Vilma",
    "cargo": "Adjunto",
    "nome": "Edna Martins",
    "telefone": "(67) 9.9819-4237",
    "estadual": "Lia Nogueira",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "DEODÁPOLIS",
    "escola": "EE Scila Médici",
    "cargo": "Adjunto",
    "nome": "Josane Marcelino Pacheco",
    "telefone": "(67) 9.9606-4111",
    "estadual": "Renato Câmara",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "DOURADINA",
    "escola": "EE Barão do Rio Branco",
    "cargo": "Adjunto",
    "nome": "Natalia Santos Oliveira",
    "telefone": "(67) 9.9978-9532",
    "estadual": "Lia Nogueira",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "DOURADOS",
    "escola": "CEEJA-de Dourados",
    "cargo": "Adjunto",
    "nome": "Marisa Martins da Silva",
    "telefone": "(67) 9.9971-6672",
    "estadual": "Zé Teixeira",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "DOURADOS",
    "escola": "Centro Estadual de Educação Profissional \"Profª. Evanilde Costa da Silva\"",
    "cargo": "Adjunto",
    "nome": "Elza Alves Pereira Bonfa",
    "telefone": "(67) 9.9692-3716",
    "estadual": "Marcelo Miranda",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Antônia da Silveira Capilé",
    "cargo": "Adjunto",
    "nome": "Elaine Costa Guimarães",
    "telefone": "(67) 9.9971-1755",
    "estadual": "Lia Nogueira",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Antônio Vicente Azambuja",
    "cargo": "Adjunto",
    "nome": "Micheli de Almeida Cardoso",
    "telefone": "(67)9.9611-5646",
    "estadual": "Zé Teixeira",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Castro Alves",
    "cargo": "Adjunto",
    "nome": "Josiléia Nairane Conrado Soligo",
    "telefone": "(67) 9627-3752",
    "estadual": "Zé Teixeira",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Floriano Viegas Machado",
    "cargo": "Adjunto",
    "nome": "Karla Granja Guimaraes Kupfer",
    "telefone": "(67) 9245-2822",
    "estadual": "Renato Câmara",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Joaquim Vaz de Oliveira",
    "cargo": "Adjunto",
    "nome": "Kely Leal da Silva Palerno",
    "telefone": "(67) 99953-1645",
    "estadual": "Lia Nogueira",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Indígena de EM Intercultural Guateka – Marçal de Souza",
    "cargo": "Adjunto",
    "nome": "Marilda Azevedo de Souza",
    "telefone": "(67) 9.9971-6990",
    "estadual": "Lia Nogueira",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Maria da Glória Muzzi Ferreira",
    "cargo": "Adjunto",
    "nome": "Alessandro Bezerra de Oliveira",
    "telefone": "(67) 9.9960-2551",
    "estadual": "",
    "federal": ""
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Menodora Fialho de Figueiredo",
    "cargo": "Adjunto",
    "nome": "Marcia da Silva Gomes",
    "telefone": "(67) 9.9698-4673",
    "estadual": "Renato Câmara",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Min. João Paulo dos Reis Veloso",
    "cargo": "Adjunto",
    "nome": "Lincoln Christian Fernandes",
    "telefone": "(67) 9.9991-6024",
    "estadual": "Renato Câmara",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Presidente Getulio Vargas",
    "cargo": "Adjunto",
    "nome": "Adriana Prolo",
    "telefone": "(67) 9.9956-6484",
    "estadual": "Zé Teixeira",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Presidente Tancredo Neves",
    "cargo": "Adjunto",
    "nome": "Christiane dos Santos F. Oliveira",
    "telefone": "(67)9. 9695-5682",
    "estadual": "Lia Nogueira",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Presidente Vargas",
    "cargo": "Adjunto",
    "nome": "Rodrigo Lima Amaro",
    "telefone": "(67) 9.8472-4518",
    "estadual": "Pedrossian Neto",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Prof. Alício Araújo",
    "cargo": "Adjunto",
    "nome": "Adriano Cosma Cabreira",
    "telefone": "(67) 9.9637-1770",
    "estadual": "Oposição",
    "federal": "Oposição"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Prof. Celso Müller do Amaral",
    "cargo": "Adjunto",
    "nome": "Elma Aparecida Gonçalves",
    "telefone": "(67) 9.9914-5863",
    "estadual": "Lia Nogueira",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Prof. José Pereira Lins",
    "cargo": "Adjunto",
    "nome": "Marcia Cristiane Felipczuk",
    "telefone": "(67) 9.9601-3887",
    "estadual": "Zé Teixeira",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Prof.ª Floriana Lopes",
    "cargo": "Adjunto",
    "nome": "Francisca Cleide da R. Teixeira",
    "telefone": "(67) 9.8126-1300",
    "estadual": "Lia Nogueira",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Ramona da Silva Pedroso",
    "cargo": "Adjunto",
    "nome": "Patrik Talhina do Amaral",
    "telefone": "(67) 9.8473-8053",
    "estadual": "Rinaldo Modesto",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Rita Angelina Barbosa Silveira",
    "cargo": "Adjunto",
    "nome": "Peres Antonio Mello de Souza",
    "telefone": "(67) 9.9615-6760",
    "estadual": "Renato Câmara",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Vilmar Vieira Matos",
    "cargo": "Adjunto",
    "nome": "Alessandra dos Santos Olmedo",
    "telefone": "(67) 9.9653-0850",
    "estadual": "Lia Nogueira",
    "federal": ""
  },
  {
    "cidade": "DOURADOS",
    "escola": "EE Vereador Moacir Djalma Barros",
    "cargo": "Adjunto",
    "nome": "Daniel Stockamann",
    "telefone": "(67) 9.9943-8695",
    "estadual": "Pedrossian Neto",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "FÁTIMA DO SUL",
    "escola": "EE Jonas Belarmino da Silva",
    "cargo": "Adjunto",
    "nome": "Edilene de Fátima Lima",
    "telefone": "(67) 9.9955-1415",
    "estadual": "Londres Machado",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "FÁTIMA DO SUL",
    "escola": "EE Senador Filinto Müller",
    "cargo": "Adjunto",
    "nome": "Leonardo de David Muhamed Zahra",
    "telefone": "(67) 9.9996-9994",
    "estadual": "Londres Machado",
    "federal": "Beto Pereira"
  },
  {
    "cidade": "FÁTIMA DO SUL",
    "escola": "EE Vicente Pallotti",
    "cargo": "Adjunto",
    "nome": "Luiz Eduardo Vieira Pereira",
    "telefone": "(67) 9.9832-7712",
    "estadual": "Londres Machado",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "FÁTIMA DO SUL",
    "escola": "EE Vila Brasil",
    "cargo": "Adjunto",
    "nome": "Rozani Moraes de Lima Reis",
    "telefone": "(67) 9.9987-2704",
    "estadual": "Londres Machado",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "GLÓRIA DE DOURADOS",
    "escola": "EE Prof.ª Eufrosina Pinto",
    "cargo": "Adjunto",
    "nome": "keli Tatiene Rodrigues de Sá",
    "telefone": "(67) 9.9826-7878",
    "estadual": "Marcelo Miranda",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "ITAPORÃ",
    "escola": "EE Rodrigues Alves",
    "cargo": "Adjunto",
    "nome": "Venicio Franco Borges",
    "telefone": "(67) 9.9820-3981",
    "estadual": "Jamilson",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "ITAPORÃ",
    "escola": "EE Edson Bezerra",
    "cargo": "Adjunto",
    "nome": "Viviani Rodelini Mendonça",
    "telefone": "(67) 9.9973-7404",
    "estadual": "Zé Teixeira",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "ITAPORÃ",
    "escola": "EE Senador Saldanha Derzi",
    "cargo": "Adjunto",
    "nome": "Lucivania Gotardi Ribeiro Balasso",
    "telefone": "(67) 99905-7200",
    "estadual": "Renato Câmara",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "ITAPORÃ",
    "escola": "EE Antonio João Ribeiro",
    "cargo": "Adjunto",
    "nome": "Cláudio Cristhiano da S. Nogueira",
    "telefone": "(67) 9928-2052",
    "estadual": "Jamilson",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "JATEÍ",
    "escola": "EE Prof.ª Bernadete dos Santos Leite",
    "cargo": "Adjunto",
    "nome": "Maria José da Silva Vieira Correia",
    "telefone": "(67) 9.9686-1596",
    "estadual": "Zé Teixeira",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "LAGUNA CARAPÃ",
    "escola": "EE Álvaro Martins dos Santos",
    "cargo": "Adjunto",
    "nome": "Dejacir Machado dos Santos",
    "telefone": "(67) 9.9999-3061",
    "estadual": "Zé Teixeira",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "MARACAJU",
    "escola": "EE Cambarai",
    "cargo": "Adjunto",
    "nome": "Géllys Luckas da Silva Agostini",
    "telefone": "(67) 9.890-4140",
    "estadual": "Marcelo Miranda",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "MARACAJU",
    "escola": "EE Cívico-Militar Coronel Lima de Figueiredo",
    "cargo": "Adjunto",
    "nome": "Elias Antonio Alves Sobrinho",
    "telefone": "(67)9.9626-5565",
    "estadual": "Paulo Correa",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "MARACAJU",
    "escola": "EE Manoel Ferreira de Lima",
    "cargo": "Adjunto",
    "nome": "Paula Fernanda de M. Francisco",
    "telefone": "(67) 9.9111-6756",
    "estadual": "Pedrossian Neto",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "MARACAJU",
    "escola": "EE Pe. Constantino de Monte",
    "cargo": "Adjunto",
    "nome": "Sheila Moreira Matos Dias",
    "telefone": "(67) 9.9253-2948",
    "estadual": "Renato Câmara",
    "federal": "Viviane Luiza"
  },
  {
    "cidade": "RIO BRILHANTE",
    "escola": "EE Profª. Ligia Terezinha Martins",
    "cargo": "Adjunto",
    "nome": "Elton Tagara Mareco",
    "telefone": "(67)99659-9971",
    "estadual": "Marcelo Miranda",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "RIO BRILHANTE",
    "escola": "EE Etalívio Pereira Martins",
    "cargo": "Adjunto",
    "nome": "Eleci Gonçalves Serra Leite",
    "telefone": "(67)9.9975-7498",
    "estadual": "Marcelo Miranda",
    "federal": "Jaime Verruck"
  },
  {
    "cidade": "RIO BRILHANTE",
    "escola": "EE Fernando Corrêa da Costa",
    "cargo": "Adjunto",
    "nome": "Marcus Vinicius da Costa",
    "telefone": "(67) 9690-0319",
    "estadual": "Lia Nogueira",
    "federal": "Mara Caseiro"
  },
  {
    "cidade": "VICENTINA",
    "escola": "EE Padre José Daniel",
    "cargo": "Adjunto",
    "nome": "Maria do Socorro Alves B. Cardoso",
    "telefone": "(67) 9.9925-1625",
    "estadual": "Londres Machado",
    "federal": "Mara Caseiro"
  }
];

const candidatos2026 = {
  "Beto Pereira": {
    "nome": "Beto Pereira",
    "numero": "1010",
    "partido": "REPUBLICANOS",
    "cargo": "Deputado Federal"
  },
  "Dagoberto": {
    "nome": "Dagoberto",
    "numero": "1111",
    "partido": "PP",
    "cargo": "Deputado Federal"
  },
  "Geraldo Resende": {
    "nome": "Geraldo Resende",
    "numero": "4411",
    "partido": "UNIÃO",
    "cargo": "Deputado Federal"
  },
  "Jaime Verruck": {
    "nome": "Jaime Verruck",
    "numero": "1011",
    "partido": "REPUBLICANOS",
    "cargo": "Deputado Federal"
  },
  "Mara Caseiro": {
    "nome": "Mara Caseiro",
    "numero": "2200",
    "partido": "PL",
    "cargo": "Deputada Federal"
  },
  "Viviane Luiza": {
    "nome": "Viviane Luiza",
    "numero": "4545",
    "partido": "PSDB",
    "cargo": "Deputada Federal"
  },
  "Hélio Peluffo": {
    "nome": "Hélio Peluffo",
    "numero": "11234",
    "partido": "PP",
    "cargo": "Deputado Estadual"
  },
  "Jamilson": {
    "nome": "Jamilson Name",
    "numero": "11444",
    "partido": "PP",
    "cargo": "Deputado Estadual"
  },
  "Lia Nogueira": {
    "nome": "Lia Nogueira",
    "numero": "45101",
    "partido": "PSDB",
    "cargo": "Deputada Estadual"
  },
  "Londres Machado": {
    "nome": "Londres Machado",
    "numero": "11123",
    "partido": "PP",
    "cargo": "Deputado Estadual"
  },
  "Marcelo Miranda": {
    "nome": "Professor Marcelo Miranda",
    "numero": "11222",
    "partido": "PP",
    "cargo": "Deputado Estadual"
  },
  "Paulo Correa": {
    "nome": "Paulo Corrêa",
    "numero": "22222",
    "partido": "PL",
    "cargo": "Deputado Estadual"
  },
  "Pedrossian Neto": {
    "nome": "Pedrossian Neto",
    "numero": "10000",
    "partido": "REPUBLICANOS",
    "cargo": "Deputado Estadual"
  },
  "Renato Câmara": {
    "nome": "Renato Câmara",
    "numero": "10150",
    "partido": "REPUBLICANOS",
    "cargo": "Deputado Estadual"
  },
  "Rinaldo Modesto": {
    "nome": "Professor Rinaldo Modesto",
    "numero": "44044",
    "partido": "UNIÃO",
    "cargo": "Deputado Estadual"
  },
  "Zé Teixeira": {
    "nome": "Zé Teixeira",
    "numero": "22121",
    "partido": "PL",
    "cargo": "Deputado Estadual"
  }
};

function perfilCandidato(nome) {
  if (!nome || nome === "Não informado") {
    return { nome: "Não informado", numero: "—", partido: "", cargo: "" };
  }
  if (nome === "Oposição") {
    return { nome: "Oposição", numero: "!", partido: "", cargo: "" };
  }
  return candidatos2026[nome] || { nome, numero: "", partido: "", cargo: "" };
}

function nomeCandidatoExibicao(nome, compact = false) {
  const original = String(nome || "").trim();
  if (!compact) return original;

  return original
    .replace(/^Professor\s+/i, "Prof. ")
    .replace(/^Professora\s+/i, "Profª. ");
}

function CandidateIdentity({ nome, compact = false }) {
  const perfil = perfilCandidato(nome);
  const semNumero = !perfil.numero || perfil.numero === "—";
  const nomeExibicao = nomeCandidatoExibicao(perfil.nome, compact);
  const tamanhoNome = nomeExibicao.length > 19 ? "long" : nomeExibicao.length > 14 ? "medium" : "short";

  return (
    <div className={`candidate-identity candidate-text-only ${compact ? "compact" : ""}`}>
      <div className={`candidate-name-main ${tamanhoNome}`}>{nomeExibicao}</div>
      <div className="candidate-info-row">
        <span className={`candidate-number-badge ${semNumero ? "muted" : ""}`}>{semNumero ? "SEM NÚMERO" : `Nº ${perfil.numero}`}</span>
        {perfil.partido ? <span className="candidate-party-badge">{perfil.partido}</span> : null}
      </div>
    </div>
  );
}

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

function normalizarBusca(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function normalizarPolitico(valor) {
  const texto = String(valor || "").trim();
  if (!texto || /^\*+$/.test(texto)) return "";
  if (normalizarBusca(texto) === "oposicao") return "Oposição";
  return texto;
}

function whatsappLink(telefone) {
  const digitos = String(telefone || "").replace(/\D/g, "");
  if (digitos.length < 10) return "";
  const numero = digitos.startsWith("55") ? digitos : `55${digitos}`;
  return `https://wa.me/${numero}`;
}

const escolasPorMunicipio = gestoresPoliticosBase.reduce((mapa, item) => {
  if (!mapa[item.cidade]) mapa[item.cidade] = [];
  if (!mapa[item.cidade].includes(item.escola)) mapa[item.cidade].push(item.escola);
  return mapa;
}, {});
Object.keys(escolasPorMunicipio).forEach((cidade) => {
  escolasPorMunicipio[cidade].sort((a, b) => a.localeCompare(b, "pt-BR"));
});

const apoiosPoliticosBase = gestoresPoliticosBase.flatMap((gestor) => {
  const registros = [];
  const estadual = normalizarPolitico(gestor.estadual);
  const federal = normalizarPolitico(gestor.federal);
  if (estadual) registros.push({ ...gestor, tipo: "Estadual", deputado: estadual });
  if (federal) registros.push({ ...gestor, tipo: "Federal", deputado: federal });
  return registros;
});

function agruparDobradinhas() {
  const mapa = new Map();
  gestoresPoliticosBase.forEach((gestor) => {
    const estadual = normalizarPolitico(gestor.estadual);
    const federal = normalizarPolitico(gestor.federal);
    if (!estadual && !federal) return;

    const estadualExibicao = estadual || "Não informado";
    const federalExibicao = federal || "Não informado";
    const chave = `${estadualExibicao}|||${federalExibicao}`;

    if (!mapa.has(chave)) {
      mapa.set(chave, {
        chave,
        estadual: estadualExibicao,
        federal: federalExibicao,
        total: 0,
        diretores: 0,
        adjuntos: 0,
        municipios: new Set(),
        registros: []
      });
    }

    const item = mapa.get(chave);
    item.total += 1;
    if (gestor.cargo === "Diretor") item.diretores += 1;
    if (gestor.cargo === "Adjunto") item.adjuntos += 1;
    item.municipios.add(gestor.cidade);
    item.registros.push({ ...gestor, estadual: estadualExibicao, federal: federalExibicao });
  });

  return Array.from(mapa.values())
    .map((item) => ({
      ...item,
      municipios: Array.from(item.municipios).sort((a, b) =>
        a.localeCompare(b, "pt-BR", { sensitivity: "base" })
      ),
      registros: [...item.registros].sort((a, b) =>
        String(a.cidade || "").localeCompare(String(b.cidade || ""), "pt-BR", { sensitivity: "base" }) ||
        String(a.escola || "").localeCompare(String(b.escola || ""), "pt-BR", { sensitivity: "base" }) ||
        String(a.cargo || "").localeCompare(String(b.cargo || ""), "pt-BR", { sensitivity: "base" }) ||
        String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", { sensitivity: "base" })
      )
    }))
    .sort((a, b) =>
      String(a.estadual || "").localeCompare(String(b.estadual || ""), "pt-BR", { sensitivity: "base" }) ||
      String(a.federal || "").localeCompare(String(b.federal || ""), "pt-BR", { sensitivity: "base" })
    );
}

const dobradinhasBase = agruparDobradinhas();

const GLOBAL_CSS = `
  :root {
    font-family: Avenir, "Segoe UI", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    color-scheme: light;
    --ms-blue: #004F9F;
    --ms-blue-dark: #14387F;
    --ms-blue-deep: #20286D;
    --ms-green: #009E3D;
    --ms-green-dark: #006B2D;
    --ms-yellow: #FFD500;
    --ms-yellow-2: #FEC32B;
    --ms-gray-900: #373435;
    --ms-gray-700: #565758;
    --ms-gray-500: #727376;
    --ms-gray-200: #E6E7E8;
    --ms-gray-100: #F1F1F2;
    --bg: #E8EEF4;
    --surface: #F7F9FB;
    --surface-2: #EEF3F7;
    --line: #C9D5E1;
    --muted: #5D6B79;
    --text: #1E2B38;
    --navy-surface: #0B315E;
    --navy-surface-2: #123F73;
    --blue-soft: #DDEAF6;
    --green-soft: #DDF1E5;
    --red: #C62828;
    --shadow: 0 10px 28px rgba(20,56,127,.08);
  }
  * { box-sizing: border-box; }
  html { background: var(--bg); }
  body { margin: 0; background: var(--bg); color: var(--text); }
  button, input, select, textarea { font: inherit; }
  button { transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease, background .15s ease; }
  button:hover { transform: translateY(-1px); }
  button:active { transform: translateY(0); }

  .radar-app {
    min-height: 100vh;
    color: var(--text);
    background:
      radial-gradient(circle at 100% 0%, rgba(0,79,159,.09), transparent 34%),
      linear-gradient(180deg, #EEF3F7 0, #E4EBF2 100%);
  }
  .radar-shell { width: min(1460px, calc(100% - 32px)); margin: 0 auto; padding: 16px 0 48px; }

  .radar-brandbar {
    position: relative;
    display:flex; align-items:center; justify-content:space-between; gap:18px; flex-wrap:wrap;
    padding:18px 22px 17px;
    border:1px solid var(--line); border-radius:14px;
    background:#F9FBFD;
    box-shadow: var(--shadow);
    overflow:hidden;
  }
  .radar-brandbar::before {
    content:""; position:absolute; inset:0 0 auto 0; height:5px;
    background:linear-gradient(90deg,var(--ms-blue) 0 54%,var(--ms-green) 54% 84%,var(--ms-yellow) 84% 100%);
  }
  .radar-brand { display:flex; align-items:center; gap:14px; }
  .radar-mark {
    position:relative; width:66px; height:66px; border-radius:18px; flex:0 0 auto;
    display:grid; place-items:center; overflow:hidden;
    background:linear-gradient(145deg,#021735 0%, #003B78 52%, #0056A8 100%);
    box-shadow:0 14px 26px rgba(0,79,159,.18);
  }
  .radar-mark::before {
    content:""; position:absolute; inset:auto 0 0 0; height:5px;
    background:linear-gradient(90deg,var(--ms-yellow) 0 42%, #F4E37F 42% 100%);
  }
  .radar-mark::after {
    content:""; position:absolute; inset:0; background:linear-gradient(145deg, rgba(255,255,255,.10), rgba(255,255,255,0));
    pointer-events:none;
  }
  .radar-ring {
    position:absolute; border-radius:50%; border:3px solid transparent; z-index:1;
  }
  .radar-ring.outer {
    width:46px; height:46px; border-top-color:#FFFFFF; border-left-color:#FFFFFF; transform:rotate(25deg);
    opacity:.95;
  }
  .radar-ring.inner {
    width:56px; height:56px; border-right-color:var(--ms-yellow); border-bottom-color:var(--ms-yellow); transform:rotate(18deg);
    opacity:.98;
  }
  .radar-core {
    width:26px; height:26px; border-radius:50%; border:2px solid rgba(255,255,255,.96);
    position:relative; z-index:2;
  }
  .radar-dot {
    position:absolute; width:11px; height:11px; border-radius:50%; z-index:3;
    background:radial-gradient(circle at 32% 32%, #FFFFFF 0 18%, #FFE44A 18% 100%);
    box-shadow:0 0 0 5px rgba(255,213,0,.16);
  }
  .radar-brand h1 { margin:0; color:var(--ms-blue-dark); font-size:clamp(23px,3vw,31px); letter-spacing:-.55px; }
  .radar-brand p { margin:4px 0 0; color:var(--ms-gray-500); font-size:12.5px; font-weight:600; }
  .status-pill {
    display:inline-flex; gap:8px; align-items:center;
    border:1px solid #BFE3CC; background:#F1FBF4; color:var(--ms-green-dark);
    padding:8px 12px; border-radius:999px; font-size:11.5px; font-weight:850;
    box-shadow:0 5px 12px rgba(0,158,61,.08);
  }
  .status-dot { width:8px; height:8px; border-radius:50%; background:var(--ms-green); }

  .radar-nav {
    display:flex; gap:10px; overflow:auto; padding:12px; margin:0 0 16px; scrollbar-width:thin;
    border:1px solid #BFCEDC; border-radius:16px; background:#DDE6EF; box-shadow:0 8px 20px rgba(20,56,127,.08);
    position:relative; z-index:3;
  }
  .nav-btn {
    flex:0 0 auto; display:flex; align-items:center; gap:10px;
    border:1px solid #B8C8D7; color:#203448; background:#F4F7FA;
    padding:12px 16px; border-radius:14px; cursor:pointer; font-weight:900; font-size:13.5px;
    box-shadow:0 4px 10px rgba(32,40,109,.035); min-height:60px; min-width:148px;
    transition:all .18s ease;
  }
  .nav-btn:hover { transform:translateY(-1px); border-color:#7899B7; background:#FFFFFF; box-shadow:0 9px 18px rgba(0,79,159,.13); }
  .nav-btn.active {
    color:#fff; border-color:var(--ms-blue-dark); background:linear-gradient(145deg,var(--ms-blue-dark),var(--ms-blue));
    box-shadow:0 10px 22px rgba(0,79,159,.22);
  }
  .nav-btn.logout {
    margin-left:auto; color:#8B2635; border-color:#E5C6CB; background:#FFF9FA; min-width:120px;
  }
  .nav-btn.logout .nav-icon { background:#FFF0F2; color:#A12D3C; }
  .nav-icon {
    width:36px; height:36px; border-radius:11px; display:grid; place-items:center; flex:0 0 auto;
    background:#EAF3FB; color:var(--ms-blue-dark); font-size:18px; box-shadow:inset 0 0 0 1px rgba(0,79,159,.08);
  }
  .nav-label-wrap { display:flex; flex-direction:column; align-items:flex-start; line-height:1.08; }
  .nav-label { font-size:13.5px; font-weight:950; }
  .nav-sub { font-size:10px; font-weight:750; color:#5F7183; margin-top:4px; }
  .nav-btn.active .nav-icon { background:rgba(255,255,255,.16); color:#fff; box-shadow:inset 0 0 0 1px rgba(255,255,255,.18); }
  .nav-btn.active .nav-sub { color:#D8E9FA; }

  .hero {
    position:relative; overflow:hidden;
    border:1px solid #0B5DA8; border-radius:16px; padding:24px 26px;
    background:linear-gradient(122deg,var(--ms-blue-dark) 0%,var(--ms-blue) 72%,#0561B6 100%);
    color:#fff; box-shadow:0 8px 18px rgba(20,56,127,.11); margin-bottom:16px;
  }
  .hero::before { content:""; position:absolute; left:0; top:0; width:7px; height:100%; background:var(--ms-yellow); }
  .hero::after { content:""; position:absolute; width:320px; height:320px; border-radius:50%; right:-140px; top:-190px; border:55px solid rgba(255,255,255,.05); pointer-events:none; }
  .eyebrow { color:#DDEEFF; font-size:10.5px; font-weight:900; letter-spacing:1.45px; text-transform:uppercase; }
  .hero h2 { margin:8px 0 7px; font-size:clamp(26px,4vw,38px); letter-spacing:-.9px; }
  .hero p { max-width:920px; margin:0; color:#E7F0F9; line-height:1.6; font-size:14.5px; }

  .kpi-grid { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:11px; margin-top:22px; }
  .kpi-card {
    padding:14px 15px; border-radius:12px;
    border:1px solid rgba(255,255,255,.26); background:rgba(255,255,255,.10);
    min-height:92px; backdrop-filter:blur(3px);
  }
  .kpi-label { display:block; color:#DDEAF6; font-size:11.5px; font-weight:750; margin-bottom:7px; }
  .kpi-value { color:#fff; font-size:28px; font-weight:950; letter-spacing:-.6px; }
  .kpi-note { margin-top:4px; color:#C7DAED; font-size:10.5px; }

  .panel {
    border:1px solid #C4D1DD; border-radius:15px; padding:21px;
    background:var(--surface); box-shadow:0 8px 22px rgba(20,56,127,.07);
  }
  .panel + .panel { margin-top:15px; }
  .panel-title { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; flex-wrap:wrap; margin-bottom:17px; padding-bottom:14px; border-bottom:1px solid #E8EDF2; }
  .panel-title h3 { margin:0; color:#17324D; font-size:20px; letter-spacing:-.2px; }
  .panel-title p { margin:5px 0 0; color:#536575; font-size:12.5px; }

  .form-section { padding:17px; background:#EEF3F7; border:1px solid #CCD8E3; border-radius:12px; margin-bottom:13px; }
  .form-section h4 { margin:0 0 14px; color:var(--ms-blue-dark); font-size:14.5px; border-left:4px solid var(--ms-green); padding-left:9px; }
  .field-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
  .field-grid.cols-3 { grid-template-columns:repeat(3,minmax(0,1fr)); }
  .field-label { display:block; color:#34485B; font-size:11.5px; font-weight:900; margin:0 0 6px; }
  .input {
    width:100%; color:#1D2A36; background:#FCFDFE; border:1px solid #B9CAD9; border-radius:8px; padding:11px 12px; outline:none;
  }
  .input::placeholder { color:#94A0AD; }
  .input:focus { border-color:var(--ms-blue); box-shadow:0 0 0 3px rgba(0,79,159,.10); }
  textarea.input { min-height:96px; resize:vertical; }
  .check-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
  .check-chip { display:flex; gap:8px; align-items:center; padding:9px 10px; background:#F9FBFC; border:1px solid #C7D5E1; border-radius:8px; color:#283E52; font-size:12.5px; }
  .check-chip:has(input:checked) { border-color:#8FC5A4; background:#F2FAF5; }
  .check-chip input { accent-color:var(--ms-green); }

  .actions { display:flex; gap:9px; flex-wrap:wrap; margin-top:12px; }
  .btn { border:1px solid transparent; border-radius:8px; padding:10px 14px; cursor:pointer; font-weight:850; color:#fff; }
  .btn.primary { background:var(--ms-blue); box-shadow:0 5px 14px rgba(0,79,159,.16); }
  .btn.primary:hover { background:var(--ms-blue-dark); }
  .btn.secondary { background:#fff; border-color:#C9D5E1; color:var(--ms-blue-dark); }
  .btn.secondary:hover { border-color:#9EB4C9; background:#F8FAFC; }
  .btn.violet { background:var(--ms-blue-deep); }
  .btn.danger { background:#A72A2A; }
  .btn.success { background:var(--ms-green-dark); }
  .btn.full { width:100%; }

  .alert-error { margin:14px 0; padding:12px 14px; border-radius:10px; background:#FFF2F2; border:1px solid #F2BBBB; color:#9A2222; font-weight:800; }
  .notice { padding:10px 12px; border-radius:9px; background:#FFF9DB; border:1px solid #F2DE7A; color:#725C00; font-size:12.5px; }

  .cards-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; align-items:stretch; }
  .politico-grid {
    display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:18px;
    align-items:stretch; grid-auto-rows:1fr;
  }
  .candidate-card {
    appearance:none; -webkit-appearance:none; width:100%; min-width:0; height:100%; min-height:258px;
    display:flex; flex-direction:column; position:relative; overflow:hidden; box-sizing:border-box;
    text-align:left; cursor:pointer; color:#F5F8FC;
    border:1px solid #2A3B58; border-radius:18px; padding:18px;
    background:linear-gradient(155deg,#0C1628 0%,#101D33 62%,#12223B 100%);
    box-shadow:0 10px 26px rgba(0,0,0,.18);
    transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease,background .18s ease;
  }
  .candidate-card::before {
    content:""; position:absolute; inset:0 0 auto 0; height:3px;
    background:linear-gradient(90deg,#3D8CFF 0%,#53C9FF 55%,#2EBF7F 100%);
    opacity:.85;
  }
  .candidate-card:hover {
    transform:translateY(-3px); border-color:#4B6F9D;
    background:linear-gradient(155deg,#101D31 0%,#14233D 62%,#162844 100%);
    box-shadow:0 18px 38px rgba(0,0,0,.26);
  }
  .candidate-card:focus-visible { outline:3px solid rgba(83,201,255,.42); outline-offset:2px; }
  .candidate-card-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; min-height:48px; }
  .candidate-role-pill {
    display:inline-flex; align-items:center; gap:6px; min-height:27px; padding:5px 9px; border-radius:999px;
    background:#152B49; color:#9BCBFF; border:1px solid #31567F;
    font-size:9.5px; font-weight:950; letter-spacing:.75px; text-transform:uppercase;
  }
  .candidate-total-box {
    min-width:58px; min-height:48px; padding:6px 9px; border-radius:12px;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    background:linear-gradient(145deg,#155AA9,#236BD0); border:1px solid #377EDB;
    box-shadow:0 7px 16px rgba(14,75,150,.26);
  }
  .candidate-total-box strong { color:#fff; font-size:20px; line-height:1; font-weight:950; }
  .candidate-total-box span { color:#CFE5FF; font-size:8.5px; font-weight:850; text-transform:uppercase; letter-spacing:.45px; margin-top:4px; }
  .candidate-card-main {
    flex:1 1 auto; min-height:108px; display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding:12px 8px 16px; text-align:center;
  }
  .candidate-card-name {
    width:100%; color:#FFFFFF; font-weight:900; line-height:1.06; letter-spacing:-.35px;
    text-align:center; text-wrap:balance; overflow-wrap:normal; word-break:normal;
  }
  .candidate-card-name.short { font-size:21px; }
  .candidate-card-name.medium { font-size:19px; }
  .candidate-card-name.long { font-size:16.5px; }
  .candidate-card-meta { display:flex; align-items:center; justify-content:center; gap:8px; flex-wrap:wrap; margin-top:13px; }
  .candidate-card-number,
  .candidate-card-party {
    display:inline-flex; align-items:center; justify-content:center; min-height:28px; border-radius:8px; padding:5px 9px;
    font-size:10.5px; font-weight:950; letter-spacing:.25px;
  }
  .candidate-card-number { background:#EDF5FC; color:#073B70; border:1px solid #BFD4E7; }
  .candidate-card-number.muted { color:#68798D; background:#DDE6EF; border-color:#AAB8C8; }
  .candidate-card-party { background:#183B69; color:#E1EEFF; border:1px solid #2F5E99; }
  .candidate-card-stats {
    display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px;
    border-top:1px solid #2A3A55; padding-top:13px; margin-top:auto;
  }
  .candidate-stat { min-width:0; text-align:center; padding:7px 4px; border-radius:9px; background:rgba(255,255,255,.035); }
  .candidate-stat strong { display:block; color:#FFFFFF; font-size:16px; line-height:1; font-weight:950; }
  .candidate-stat span { display:block; color:#8FA4BD; font-size:9px; font-weight:800; margin-top:5px; text-transform:uppercase; letter-spacing:.35px; }
  .candidate-card-action {
    display:flex; align-items:center; justify-content:center; gap:7px; margin-top:12px;
    color:#8EC7FF; font-size:10.5px; font-weight:900; letter-spacing:.2px;
  }
  .candidate-card-action span { font-size:15px; transition:transform .18s ease; }
  .candidate-card:hover .candidate-card-action span { transform:translateX(3px); }

  .politico-card, .double-card {
    text-align:left; color:var(--text); cursor:pointer; border:1px solid #BFCFDD;
    background:linear-gradient(180deg,#F6F9FC 0%,#EDF3F8 100%);
    border-radius:12px; padding:16px; min-height:150px; box-shadow:0 6px 15px rgba(20,56,127,.07);
  }
  .politico-card:hover, .double-card:hover { border-color:#8EB5D7; box-shadow:0 9px 20px rgba(0,79,159,.10); }
  .card-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
  .type-tag { display:inline-flex; align-items:center; padding:5px 8px; border-radius:999px; background:#EAF3FB; color:var(--ms-blue-dark); font-size:9.5px; font-weight:900; letter-spacing:.7px; text-transform:uppercase; }
  .politico-card h4 { margin:8px 0 0; color:#162F4B; font-size:18px; }
  .count-badge { min-width:43px; height:43px; display:grid; place-items:center; border-radius:9px; background:var(--ms-blue); color:#fff; border-bottom:3px solid var(--ms-yellow); font-weight:950; font-size:17px; }
  .card-stats { display:flex; gap:12px; flex-wrap:wrap; color:#617386; font-size:11.5px; margin-top:17px; padding-top:11px; border-top:1px solid #E7EDF2; }
  .double-card { border-top:4px solid var(--ms-blue); }
  .double-card:hover { background:linear-gradient(180deg,#FFFFFF 0%,#E9F1F7 100%); }
  .double-card .card-stats { color:#344B61; border-top-color:#C9D6E2; }
  .double-card .count-badge { background:#0B4C8D; }

  .section-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin:26px 0 12px; }
  .section-heading h3 { margin:0; color:#152F4A; font-size:20px; }
  .section-heading p { margin:4px 0 0; color:var(--muted); font-size:12px; }
  .filter-row { display:grid; grid-template-columns:1.3fr .7fr; gap:10px; margin-top:16px; }
  .detail-city { margin-top:17px; padding-top:15px; border-top:1px solid #E2E8EF; }
  .detail-city-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:10px; }
  .detail-city-head h4 { margin:0; color:var(--ms-blue-dark); font-size:17px; }

  .people-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
  .person-card { padding:14px; border:1px solid #C3D1DE; border-radius:10px; background:#F2F6F9; }
  .school { font-weight:900; font-size:12.5px; color:#34475B; padding-bottom:8px; border-bottom:1px solid #E3E9EF; }
  .role { color:var(--ms-blue); font-size:9.5px; font-weight:900; text-transform:uppercase; letter-spacing:.7px; margin-top:9px; }
  .person-name { color:#26384B; font-size:14.5px; font-weight:900; margin:4px 0 9px; }
  .wa { display:block; text-decoration:none; text-align:center; color:#fff; background:var(--ms-green-dark); border:1px solid var(--ms-green-dark); border-radius:7px; padding:8px 9px; font-size:11.5px; font-weight:850; }
  .phone-off { color:#748294; font-size:11.5px; background:#F0F3F6; border-radius:7px; padding:8px 9px; text-align:center; }

  .double-pair { display:grid; grid-template-columns:1fr auto 1fr; gap:9px; align-items:center; margin-top:10px; }
  .candidate-box { min-width:0; padding:11px 12px; border-radius:9px; border:1px solid transparent; }
  .candidate-box:first-child { background:linear-gradient(145deg,#0B4C8D,#0E5EA9); border-color:#0A4B89; }
  .candidate-box:last-child { background:linear-gradient(145deg,#087236,#009E3D); border-color:#087236; }
  .candidate-label { display:block; color:rgba(255,255,255,.78); font-size:9px; font-weight:900; letter-spacing:.7px; text-transform:uppercase; margin-bottom:4px; }
  .candidate-name { display:block; color:#FFFFFF; font-weight:950; font-size:13.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .pair-plus { width:28px; height:28px; display:grid; place-items:center; border-radius:50%; background:var(--ms-yellow); color:#4C4200; font-weight:950; }
  .complete-tag { display:inline-flex; padding:4px 7px; border-radius:999px; background:#E8F7EE; color:var(--ms-green-dark); border:1px solid #BFE2CC; font-size:9.5px; font-weight:900; text-transform:uppercase; }
  .partial-tag { display:inline-flex; padding:4px 7px; border-radius:999px; background:#FFF7CF; color:#715D00; border:1px solid #E8D673; font-size:9.5px; font-weight:900; text-transform:uppercase; }
  .opposition-tag { display:inline-flex; padding:4px 7px; border-radius:999px; background:#FFF0F0; color:#A42828; border:1px solid #E9BBBB; font-size:9.5px; font-weight:900; text-transform:uppercase; }

  .list-card { padding:16px; border:1px solid #C2CFDB; border-radius:11px; background:#F5F8FA; margin-bottom:10px; box-shadow:0 4px 12px rgba(20,56,127,.04); }
  .list-card h4 { color:#18334E; margin:0 0 8px; }
  .list-card p { margin:4px 0; color:#3F5366; font-size:12.5px; }

  .chart-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
  .chart-panel { padding:16px; border:1px solid #C4D2DE; border-radius:11px; background:#F5F8FA; }
  .chart-panel h4 { color:var(--ms-blue-dark); }
  .chart-vertical { min-height:290px; display:flex; align-items:flex-end; justify-content:center; gap:18px; padding:20px 10px 4px; }
  .chart-col { width:min(120px,30%); display:flex; flex-direction:column; align-items:center; gap:7px; cursor:pointer; }
  .chart-track { height:175px; width:55px; display:flex; align-items:flex-end; overflow:hidden; border-radius:8px 8px 4px 4px; background:#EEF3F7; border:1px solid #D8E1EA; }
  .chart-bar { width:100%; min-height:2px; border-radius:7px 7px 0 0; }
  .chart-horizontal-item { margin:12px 0; }
  .chart-horizontal-text { display:flex; justify-content:space-between; gap:10px; color:#4F6072; font-size:12px; margin-bottom:5px; }
  .chart-horizontal-track { height:9px; background:#EDF2F6; border-radius:999px; overflow:hidden; }
  .chart-horizontal-bar { height:100%; background:linear-gradient(90deg,var(--ms-blue),var(--ms-green)); border-radius:999px; }

  .login-page { min-height:100vh; display:grid; place-items:center; padding:22px; background:linear-gradient(145deg,#EEF4F9,#F7F9FB); }
  .login-box { width:min(430px,100%); background:#fff; color:var(--text); border:1px solid #D8E2EB; border-radius:15px; padding:30px; text-align:center; box-shadow:0 18px 45px rgba(20,56,127,.14); position:relative; overflow:hidden; }
  .login-box::before { content:""; position:absolute; inset:0 0 auto 0; height:5px; background:linear-gradient(90deg,var(--ms-blue) 0 55%,var(--ms-green) 55% 85%,var(--ms-yellow) 85% 100%); }
  .login-logo-wrap { display:flex; justify-content:center; margin-bottom:14px; }
  .login-logo-wrap .radar-mark { width:74px; height:74px; border-radius:20px; }
  .login-box .eyebrow { color:var(--ms-blue); }
  .login-box h1 { margin:7px 0 6px; color:var(--ms-blue-dark); }
  .login-box p { color:#69798A; line-height:1.5; font-size:13px; }

  .report-page { min-height:100vh; background:#fff; color:#243244; padding:28px; font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif; }
  .report-page > h1 { color:var(--ms-blue-dark); border-bottom:4px solid var(--ms-yellow); padding-bottom:8px; }
  .report-page > h2 { color:var(--ms-blue); }
  .report-box { border:1px solid #D7E0E8; border-radius:9px; padding:15px; margin:12px 0; break-inside:avoid; }
  .report-box h2, .report-box h3 { color:var(--ms-blue-dark); }
  .report-item { border-top:1px solid #E4E9EF; padding:10px 0; }

  @media (max-width:1120px) {
    .kpi-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
    .cards-grid,.people-grid,.politico-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
  }
  @media (max-width:780px) {
    .radar-shell { width:min(100% - 18px,1460px); padding-top:9px; }
    .radar-brandbar { border-radius:11px; padding:16px 15px 14px; }
    .radar-mark { width:56px; height:56px; border-radius:16px; }
    .status-pill { width:100%; justify-content:center; }
    .nav-btn { min-width:unset; width:100%; min-height:64px; }
    .nav-icon { width:40px; height:40px; }
    .nav-label { font-size:14px; }
    .nav-btn.logout { margin-left:0; }
    .hero { border-radius:13px; padding:22px 19px 21px; }
    .kpi-grid,.cards-grid,.people-grid,.politico-grid,.chart-grid,.field-grid,.field-grid.cols-3,.check-grid,.filter-row { grid-template-columns:1fr; }
    .candidate-card { min-height:238px; }
    .double-pair { grid-template-columns:1fr; }
    .candidate-box { height:auto; min-height:146px; }
    .pair-plus { transform:none; margin:auto; }
  }

  /* =========================================================
     TEMA DARK EXECUTIVO — inspirado em dashboards de campanha,
     preservando azul/verde/amarelo como referências institucionais.
     ========================================================= */
  .radar-app {
    background:
      radial-gradient(circle at 82% 0%, rgba(63,81,181,.20), transparent 29%),
      radial-gradient(circle at 0% 35%, rgba(0,158,61,.08), transparent 24%),
      linear-gradient(145deg,#070C18 0%,#0A1021 45%,#11142D 100%);
    color:#F8FAFC;
  }
  .radar-shell { width:min(1480px,calc(100% - 28px)); }
  .radar-brandbar {
    border-color:#202B44; background:rgba(8,14,30,.94); box-shadow:0 20px 48px rgba(0,0,0,.28);
  }
  .radar-brandbar::before { background:linear-gradient(90deg,#0D65D9 0 52%,#00A66A 52% 82%,#FFD21E 82%); }
  .radar-brand h1 { color:#FFFFFF; }
  .radar-brand p { color:#AEBBD0; }
  .status-pill { background:#0D201B; border-color:#17583D; color:#7EE2AB; box-shadow:none; }

  .radar-nav {
    gap:11px; padding:10px 12px; border-radius:18px;
    background:rgba(7,13,29,.98); border-color:#263652;
    box-shadow:0 14px 34px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,255,255,.025);
  }
  .nav-btn {
    position:relative; min-height:68px; min-width:160px; padding:10px 14px;
    gap:11px; border-radius:15px;
    background:linear-gradient(180deg,#111B30 0%,#0E1729 100%);
    color:#F6F9FD; border-color:#2C3C58;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.025);
  }
  .nav-btn:hover {
    background:linear-gradient(180deg,#17243C 0%,#121D32 100%);
    border-color:#46678E; box-shadow:0 9px 22px rgba(0,0,0,.18);
    transform:translateY(-1px);
  }
  .nav-btn.active {
    background:linear-gradient(135deg,#0F55B7 0%,#213EAA 58%,#4538C7 100%);
    border-color:#5A77E5;
    box-shadow:0 10px 26px rgba(34,68,191,.34), inset 0 1px 0 rgba(255,255,255,.12);
  }
  .nav-btn.active::after {
    content:""; position:absolute; left:14px; right:14px; bottom:6px; height:3px;
    border-radius:999px; background:linear-gradient(90deg,#60A5FA,#45D9C7);
  }
  .nav-icon {
    width:42px; height:42px; border-radius:12px;
    background:linear-gradient(145deg,#172942,#122039);
    color:#8EC5FF; border:1px solid #314B6A;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.045), 0 4px 10px rgba(0,0,0,.12);
  }
  .nav-icon svg { width:23px; height:23px; display:block; }
  .nav-label-wrap { min-width:0; gap:1px; }
  .nav-label {
    font-size:14.5px; line-height:1.12; font-weight:850; letter-spacing:-.15px;
    color:#FFFFFF;
  }
  .nav-sub {
    font-size:10.5px; line-height:1.2; font-weight:700; color:#A3B2C7; margin-top:3px;
    letter-spacing:.05px;
  }
  .nav-btn.active .nav-icon {
    background:rgba(255,255,255,.14); color:#FFFFFF;
    border-color:rgba(255,255,255,.30); box-shadow:inset 0 1px 0 rgba(255,255,255,.12);
  }
  .nav-btn.active .nav-label { color:#FFFFFF; }
  .nav-btn.active .nav-sub { color:#E0E8FF; }
  .nav-btn.logout {
    min-width:142px; background:linear-gradient(180deg,#25141A 0%,#1D1117 100%);
    color:#FFD9DE; border-color:#6B3240;
  }
  .nav-btn.logout:hover { background:linear-gradient(180deg,#321820 0%,#261219 100%); border-color:#914659; }
  .nav-btn.logout .nav-icon { background:#301720; color:#FF9CAC; border-color:#66303D; }
  .nav-btn.logout .nav-label { color:#FFE6EA; }
  .nav-btn.logout .nav-sub { color:#C89AA4; }

  .hero {
    border-color:#273359;
    background:linear-gradient(118deg,#0D1530 0%,#161B45 60%,#173C72 100%);
    box-shadow:0 18px 42px rgba(0,0,0,.25);
  }
  .hero::before { background:linear-gradient(180deg,#52A7FF,#35E0D0,#FFD21E); }
  .hero::after { border-color:rgba(112,118,255,.14); }
  .eyebrow { color:#8DBBFF; }
  .hero p { color:#C1CCE0; }
  .kpi-card { background:rgba(255,255,255,.055); border-color:rgba(255,255,255,.14); }
  .kpi-label { color:#A9BBD4; }
  .kpi-note { color:#91A6C2; }

  .panel { background:#0C1427; border-color:#202C46; box-shadow:0 15px 38px rgba(0,0,0,.22); }
  .panel-title { border-color:#202D47; }
  .panel-title h3,.section-heading h3 { color:#F8FAFC; }
  .panel-title p,.section-heading p { color:#93A4BC; }
  .form-section { background:#0F192D; border-color:#26334E; }
  .form-section h4 { color:#EAF2FF; border-left-color:#15C779; }
  .field-label { color:#B8C6D9; }
  .input { background:#111C31; color:#F8FAFC; border-color:#33445F; }
  .input::placeholder { color:#71839D; }
  .input:focus { border-color:#4C8DFF; box-shadow:0 0 0 3px rgba(76,141,255,.16); }
  select.input option { color:#111827; background:#FFFFFF; }
  .check-chip { background:#111C31; color:#D9E5F3; border-color:#33445F; }
  .check-chip:has(input:checked) { background:#0E2A22; border-color:#16885A; }

  .btn.primary { background:linear-gradient(145deg,#125FCE,#2148B8); }
  .btn.secondary { background:#121D31; color:#DDE9F8; border-color:#34445F; }
  .btn.secondary:hover { background:#17243B; }

  .politico-card,.double-card { background:#0F192D; color:#F3F7FC; border-color:#293753; box-shadow:0 10px 24px rgba(0,0,0,.16); }
  .section-count {
    display:inline-flex; align-items:center; justify-content:center; min-height:30px; padding:6px 10px; border-radius:999px;
    background:#142744; color:#A8D4FF; border:1px solid #2D4B72; font-size:10.5px; font-weight:900;
  }
  .politico-card:hover,.double-card:hover { background:#121F36; border-color:#426594; box-shadow:0 16px 34px rgba(0,0,0,.22); transform:translateY(-1px); }
  .politico-card h4 { color:#FFFFFF; }
  .type-tag { background:#172B4B; color:#90C4FF; border:1px solid #284B7E; }
  .count-badge { background:linear-gradient(145deg,#164F9E,#2E5FCC); border-bottom-color:#FFD21E; }
  .card-stats { color:#9DAFC5; border-top-color:#26344E; }

  .candidate-identity { width:100%; min-width:0; }
  .candidate-text-only {
    display:flex; flex-direction:column; justify-content:center; align-items:center; gap:10px;
    min-height:112px; height:100%; padding:14px 14px; border-radius:13px;
    background:linear-gradient(145deg,#0A1222 0%,#101C32 100%);
    border:1px solid #2B3B57;
    text-align:center;
    font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  }
  .candidate-name-main {
    width:100%; color:#FFFFFF; line-height:1.08; font-weight:850; letter-spacing:-.30px;
    overflow-wrap:normal; word-break:normal; text-align:center; text-wrap:balance;
  }
  .candidate-name-main.short { font-size:18px; }
  .candidate-name-main.medium { font-size:16.5px; }
  .candidate-name-main.long { font-size:15px; }
  .candidate-info-row { display:flex; align-items:center; justify-content:center; gap:7px; flex-wrap:wrap; width:100%; }
  .candidate-number-badge {
    display:inline-flex; align-items:center; justify-content:center; min-height:28px; padding:5px 10px; border-radius:8px;
    background:#F4F8FC; color:#0A3F78; border:1px solid #B9CCE0;
    box-shadow:inset 0 1px 0 rgba(255,255,255,.85);
    font-size:12px; font-weight:950; letter-spacing:.2px;
  }
  .candidate-number-badge.muted { background:#E8EEF5; color:#66788D; border-color:#AEBCCD; }
  .candidate-party-badge {
    display:inline-flex; align-items:center; min-height:28px; padding:5px 9px; border-radius:8px;
    background:#173867; color:#DDEEFF; border:1px solid #2D568D;
    font-size:11px; font-weight:900; letter-spacing:.45px;
  }
  .candidate-identity.compact { min-height:0; height:100%; }
  .candidate-identity.compact.candidate-text-only { min-height:112px; height:100%; }
  .candidate-identity.compact .candidate-name-main.short { font-size:17px; }
  .candidate-identity.compact .candidate-name-main.medium { font-size:15.5px; }
  .candidate-identity.compact .candidate-name-main.long { font-size:14.2px; }
  .candidate-identity.compact .candidate-info-row { gap:6px; }
  .candidate-identity.compact .candidate-number-badge,
  .candidate-identity.compact .candidate-party-badge { min-height:24px; padding:4px 7px; font-size:10px; }
  .politico-card .candidate-identity { margin:12px 0 2px; }

  .candidate-detail-head { display:grid; grid-template-columns:minmax(260px,390px) 1fr; gap:22px; align-items:center; }
  .candidate-detail-copy { text-align:center; }
  .candidate-detail-copy h2 { margin:4px 0 6px; text-align:center; }
  .candidate-detail-copy .candidate-number { display:inline-flex; gap:8px; align-items:center; color:#FFD65C; font-weight:950; }

  .double-pair {
    grid-template-columns:minmax(0,1fr) 42px minmax(0,1fr);
    gap:12px; align-items:stretch;
  }
  .candidate-box {
    min-width:0; min-height:154px; height:154px; padding:9px;
    display:flex; flex-direction:column;
    background:#0A1222 !important; border:1px solid #263650 !important;
  }
  .candidate-box .candidate-label { flex:0 0 auto; }
  .candidate-box .candidate-identity { flex:1 1 auto; display:flex; margin-top:7px; }
  .pair-plus {
    align-self:center; justify-self:center;
    width:38px; height:38px; border-radius:12px;
    background:linear-gradient(145deg,#142844,#1C426E); color:#F3F8FF;
    border:1px solid #3C6590; box-shadow:0 7px 16px rgba(0,0,0,.22);
    font-size:0;
  }
  .pair-plus::before {
    content:"&"; font-size:22px; line-height:1; font-weight:950;
    font-family:Georgia,"Times New Roman",serif;
  }
  .complete-tag { background:#0C2A20; color:#83E5AE; border-color:#1B6C4B; }
  .partial-tag { background:#332B0B; color:#F8DA66; border-color:#776421; }
  .opposition-tag { background:#35141B; color:#FFB4C0; border-color:#7B3040; }

  .detail-city { border-top-color:#26344E; }
  .detail-city-head h4 { color:#F8FAFC; }
  .person-card,.list-card,.chart-panel { background:#0F192D; border-color:#293753; box-shadow:none; }
  .school,.person-name,.list-card h4,.chart-panel h4 { color:#F4F8FC; }
  .school { border-bottom-color:#273650; }
  .role { color:#74B4FF; }
  .list-card p { color:#AFC0D4; }
  .phone-off { background:#182338; color:#A4B4C9; }
  .wa { background:#09864D; border-color:#119B5D; }
  .chart-horizontal-text { color:#C0CCDB; }
  .chart-horizontal-track,.chart-track { background:#172238; border-color:#2C3A56; }
  .notice { background:#302A0E; color:#F3D56E; border-color:#66561C; }
  .alert-error { background:#35141B; color:#FFBCC7; border-color:#783342; }

  .brand-footnote { margin-top:12px; font-size:10.5px; color:#7F92AB; line-height:1.45; }

  @media (max-width:820px) {
    .candidate-detail-head { grid-template-columns:1fr; }
  }


  /* =========================================================
     MOBILE — navegação completa visível sem rolagem horizontal
     ========================================================= */
  @media (max-width:780px) {
    .radar-shell {
      width:calc(100% - 14px);
      padding-top:7px;
    }

    .radar-brandbar {
      padding:13px 13px 12px;
      gap:10px;
      border-radius:14px;
    }
    .radar-brand {
      width:100%;
      gap:12px;
    }
    .radar-mark {
      width:54px;
      height:54px;
      border-radius:15px;
    }
    .radar-brand h1 {
      font-size:clamp(25px,7.2vw,30px);
      line-height:1.02;
    }
    .radar-brand p {
      margin-top:5px;
      font-size:11.5px;
      line-height:1.35;
    }
    .status-pill {
      width:100%;
      min-height:42px;
      justify-content:center;
      padding:8px 10px;
      font-size:11.5px;
    }

    .radar-nav {
      display:grid;
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:7px;
      overflow:visible;
      padding:8px;
      margin:10px 0 12px;
      border-radius:15px;
    }
    .nav-btn {
      min-width:0 !important;
      width:100% !important;
      min-height:82px;
      padding:8px 5px 9px;
      gap:5px;
      border-radius:12px;
      flex-direction:column;
      justify-content:center;
      align-items:center;
      text-align:center;
    }
    .nav-icon {
      width:34px;
      height:34px;
      border-radius:10px;
      flex:0 0 auto;
    }
    .nav-icon svg {
      width:19px;
      height:19px;
    }
    .nav-label-wrap {
      width:100%;
      align-items:center;
      text-align:center;
      gap:0;
    }
    .nav-label {
      width:100%;
      font-size:11.2px;
      line-height:1.05;
      letter-spacing:-.12px;
      white-space:normal;
      text-align:center;
    }
    .nav-sub {
      display:none;
    }
    .nav-btn.active::after {
      left:9px;
      right:9px;
      bottom:5px;
      height:2px;
    }
    .nav-btn.logout {
      grid-column:1 / -1;
      min-height:43px;
      flex-direction:row;
      gap:8px;
      padding:6px 12px;
      margin-left:0;
    }
    .nav-btn.logout .nav-icon {
      width:29px;
      height:29px;
    }
    .nav-btn.logout .nav-label-wrap {
      width:auto;
      align-items:flex-start;
    }
    .nav-btn.logout .nav-label {
      font-size:11.5px;
      text-align:left;
    }

    /* O painel executivo vem imediatamente depois da navegação e fica compacto. */
    .hero {
      margin-top:0;
      border-radius:14px;
      padding:20px 17px 18px;
    }
    .hero h2 {
      font-size:clamp(25px,7vw,31px);
      line-height:1.08;
    }
    .hero p {
      font-size:13px;
      line-height:1.52;
    }
    .kpi-grid {
      grid-template-columns:repeat(2,minmax(0,1fr)) !important;
      gap:8px;
      margin-top:16px;
    }
    .kpi-card {
      min-height:92px;
      padding:12px;
    }
    .kpi-label {
      font-size:10.5px;
      line-height:1.25;
    }
    .kpi-value {
      font-size:25px;
    }
    .kpi-note {
      font-size:9.5px;
      line-height:1.25;
    }

    .cards-grid,.people-grid,.politico-grid,.chart-grid,.field-grid,.field-grid.cols-3,.check-grid,.filter-row {
      grid-template-columns:1fr;
    }
  }

  @media (max-width:390px) {
    .radar-nav {
      gap:6px;
      padding:7px;
    }
    .nav-btn {
      min-height:78px;
      padding-left:3px;
      padding-right:3px;
    }
    .nav-label {
      font-size:10.4px;
    }
    .nav-icon {
      width:32px;
      height:32px;
    }
    .kpi-grid {
      grid-template-columns:repeat(2,minmax(0,1fr)) !important;
    }
  }

  @media print {
    @page { margin:12mm; }
    body,.radar-app,.report-page { background:#fff !important; color:#222 !important; }
    .radar-shell { width:100%; padding:0; }
    .no-print,.radar-brandbar,.radar-nav,.actions { display:none !important; }
    .hero,.panel,.politico-card,.double-card,.person-card,.list-card,.chart-panel,.report-box { box-shadow:none !important; break-inside:avoid; }
    .hero { background:#fff !important; color:#222 !important; border:2px solid #004F9F !important; }
    .hero p,.hero .eyebrow,.hero .kpi-label,.hero .kpi-note,.hero .kpi-value { color:#222 !important; }
    .kpi-card { background:#fff !important; border:1px solid #bbb !important; }
  }

`;

// Componente estável fora de App. Isso evita que o formulário seja desmontado
// e montado novamente a cada tecla digitada, preservando foco e posição da página.
function StableShell({ brand, nav, children }) {
  return (
    <div className="radar-app">
      <style>{GLOBAL_CSS}</style>
      <div className="radar-shell">
        {brand}
        {nav}
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const SENHA_ACESSO = "radar2026";

  const [senhaDigitada, setSenhaDigitada] = useState("");
  const [autenticado, setAutenticado] = useState(() => {
    try { return window.localStorage.getItem("radar_auth") === "ok"; }
    catch { return false; }
  });
  const [tela, setTela] = useState("inicio");
  const [registros, setRegistros] = useState([]);
  const [form, setForm] = useState(formLimpo);
  const [editandoId, setEditandoId] = useState(null);
  const [formAberto, setFormAberto] = useState(null);
  const [filtroAtivo, setFiltroAtivo] = useState(null);
  const [municipioIndicador, setMunicipioIndicador] = useState("GERAL");
  const [detalhePolitico, setDetalhePolitico] = useState(null);
  const [detalheDobradinha, setDetalheDobradinha] = useState(null);
  const [buscaPolitica, setBuscaPolitica] = useState("");
  const [buscaDobradinha, setBuscaDobradinha] = useState("");
  const [filtroDobradinha, setFiltroDobradinha] = useState("TODAS");
  const [erroSistema, setErroSistema] = useState("");

  useEffect(() => { if (autenticado) carregarRegistros(); }, [autenticado]);

  function rolarParaTopo() {
    const aplicar = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      } catch {
        window.scrollTo(0, 0);
      }
    };

    // Executa depois que a nova tela foi renderizada. O segundo frame evita
    // que o navegador restaure a posição anterior após a troca de aba.
    requestAnimationFrame(() => requestAnimationFrame(aplicar));
  }

  useEffect(() => {
    if (autenticado) rolarParaTopo();
  }, [tela]);

  async function carregarRegistros() {
    try {
      setErroSistema("");
      const dados = await getDocs(collection(db, "reunioes_gestores"));
      setRegistros(dados.docs.map((item) => ({ id: item.id, ...item.data() })));
    } catch (erro) {
      console.error("Erro ao carregar registros:", erro);
      setErroSistema("Não foi possível carregar os registros do Firebase. Verifique sua conexão e as regras do Firestore.");
    }
  }

  function entrarNaPlataforma() {
    if (senhaDigitada === SENHA_ACESSO) {
      try { window.localStorage.setItem("radar_auth", "ok"); } catch { /* ambiente sem localStorage */ }
      setAutenticado(true);
      setSenhaDigitada("");
    } else {
      alert("Senha incorreta.");
    }
  }

  function sairDaPlataforma() {
    try { window.localStorage.removeItem("radar_auth"); } catch { /* ambiente sem localStorage */ }
    setAutenticado(false);
    setTela("inicio");
    setSenhaDigitada("");
    setDetalhePolitico(null);
    setDetalheDobradinha(null);
  }

  function navegar(destino) {
    setTela(destino);
    setDetalhePolitico(null);
    setDetalheDobradinha(null);
    setFiltroAtivo(null);
    rolarParaTopo();
  }

  function resumirDeputados(tipo) {
    const mapa = {};
    apoiosPoliticosBase
      .filter((registro) => registro.tipo === tipo)
      .forEach((registro) => {
        const nome = normalizarPolitico(registro.deputado);
        if (!mapa[nome]) mapa[nome] = { tipo, deputado: nome, diretores: 0, adjuntos: 0, total: 0 };
        if (registro.cargo === "Diretor") mapa[nome].diretores += 1;
        if (registro.cargo === "Adjunto") mapa[nome].adjuntos += 1;
        mapa[nome].total += 1;
      });
    return Object.values(mapa).sort((a, b) => b.total - a.total || a.deputado.localeCompare(b.deputado, "pt-BR"));
  }

  const gruposEstaduais = useMemo(() => resumirDeputados("Estadual"), []);
  const gruposFederais = useMemo(() => resumirDeputados("Federal"), []);
  const oposicaoEstadual = gruposEstaduais.find((item) => item.deputado === "Oposição") || null;
  const oposicaoFederal = gruposFederais.find((item) => item.deputado === "Oposição") || null;
  const deputadosEstaduais = gruposEstaduais.filter((item) => item.deputado !== "Oposição");
  const deputadosFederais = gruposFederais.filter((item) => item.deputado !== "Oposição");

  const deputadosEstaduaisFiltrados = deputadosEstaduais.filter((item) => normalizarBusca(item.deputado).includes(normalizarBusca(buscaPolitica)));
  const deputadosFederaisFiltrados = deputadosFederais.filter((item) => normalizarBusca(item.deputado).includes(normalizarBusca(buscaPolitica)));

  const dobradinhasFiltradas = dobradinhasBase
    .filter((item) => {
      const busca = normalizarBusca(buscaDobradinha);
      const correspondeBusca = !busca || normalizarBusca(`${item.estadual} ${item.federal}`).includes(busca);
      const completa = item.estadual !== "Não informado" && item.federal !== "Não informado";
      const correspondeTipo = filtroDobradinha === "TODAS" || (filtroDobradinha === "COMPLETAS" && completa) || (filtroDobradinha === "PARCIAIS" && !completa);
      return correspondeBusca && correspondeTipo;
    })
    .sort((a, b) =>
      String(a.estadual || "").localeCompare(String(b.estadual || ""), "pt-BR", { sensitivity: "base" }) ||
      String(a.federal || "").localeCompare(String(b.federal || ""), "pt-BR", { sensitivity: "base" })
    );

  function registrosDoDeputado(item) {
    if (!item) return [];
    return apoiosPoliticosBase
      .filter((registro) => registro.tipo === item.tipo && normalizarPolitico(registro.deputado) === normalizarPolitico(item.deputado))
      .sort((a, b) => a.cidade.localeCompare(b.cidade, "pt-BR") || a.escola.localeCompare(b.escola, "pt-BR") || a.cargo.localeCompare(b.cargo, "pt-BR") || a.nome.localeCompare(b.nome, "pt-BR"));
  }

  function totalDeputados(lista) { return lista.reduce((soma, item) => soma + item.total, 0); }
  function totalDiretoresDeputados(lista) { return lista.reduce((soma, item) => soma + item.diretores, 0); }
  function totalAdjuntosDeputados(lista) { return lista.reduce((soma, item) => soma + item.adjuntos, 0); }

  function baseIndicadores() {
    return municipioIndicador === "GERAL" ? registros : registros.filter((r) => r.municipio === municipioIndicador);
  }

  const baseAtual = baseIndicadores();
  const registrosOrdenados = [...registros].sort((a, b) => String(a.escola || "").localeCompare(String(b.escola || ""), "pt-BR"));
  const baseOrdenada = [...baseAtual].sort((a, b) => String(a.escola || "").localeCompare(String(b.escola || ""), "pt-BR"));
  const totalFormularios = baseAtual.length;
  const totalGestoresAvaliados = baseAtual.reduce((total, r) => total + (r.diretor ? 1 : 0) + (r.adjunto ? 1 : 0), 0);

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

    try {
      setErroSistema("");
      if (editandoId) {
        await updateDoc(doc(db, "reunioes_gestores", editandoId), { ...form, atualizadoEm: new Date().toISOString() });
        alert("Formulário atualizado com sucesso!");
      } else {
        await addDoc(collection(db, "reunioes_gestores"), { ...form, criadoEm: new Date().toISOString() });
        alert("Reunião salva com sucesso!");
      }
      setForm(formLimpo);
      setEditandoId(null);
      await carregarRegistros();
      navegar("inicio");
    } catch (erro) {
      console.error("Erro ao salvar:", erro);
      setErroSistema("Não foi possível salvar no Firebase. Verifique sua conexão e as regras do Firestore.");
    }
  }

  function editarFormulario(registro) {
    const { id, ...dados } = registro;
    setForm({ ...formLimpo, ...dados, demandas: dados.demandas || [], administrativas: dados.administrativas || [] });
    setEditandoId(id);
    setFormAberto(null);
    setFiltroAtivo(null);
    setTela("inicio");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluirRegistro(id) {
    if (!window.confirm("Deseja realmente excluir este formulário?")) return;
    try {
      setErroSistema("");
      await deleteDoc(doc(db, "reunioes_gestores", id));
      setFormAberto(null);
      await carregarRegistros();
      alert("Formulário excluído com sucesso!");
    } catch (erro) {
      console.error("Erro ao excluir:", erro);
      setErroSistema("Não foi possível excluir o formulário no Firebase.");
    }
  }

  function gerarPDF() { window.print(); }
  function imprimirFormulario(registro) { setFormAberto(registro); setTimeout(() => window.print(), 400); }

  function contarClassificacao(tipo) {
    return baseAtual.reduce((total, r) => total + (r.classificacaoDiretor === tipo ? 1 : 0) + (r.classificacaoAdjunto === tipo ? 1 : 0), 0);
  }
  function contarEngajamento(tipo) {
    return baseAtual.reduce((total, r) => total + (r.interesseAgendaDiretor === tipo ? 1 : 0) + (r.interesseAgendaAdjunto === tipo ? 1 : 0), 0);
  }
  function contarArray(campo, opcao) {
    return baseAtual.reduce((total, r) => {
      const lista = Array.isArray(r[campo]) ? r[campo] : [];
      return lista.includes(opcao) ? total + 1 : total;
    }, 0);
  }
  function normalizarPercepcao(valor) {
    const texto = normalizarBusca(valor);
    if (texto.includes("ressalva")) return "Positivo com ressalvas";
    if (texto.includes("negativ")) return "Negativo";
    if (texto.includes("positiv")) return "Positivo";
    return "";
  }
  function contarPercepcao(campo, opcao) {
    return baseAtual.reduce((total, r) => normalizarPercepcao(r[campo]) === opcao ? total + 1 : total, 0);
  }

  const verde = contarClassificacao("VERDE");
  const amarelo = contarClassificacao("AMARELO");
  const vermelho = contarClassificacao("VERMELHO");
  const alto = contarEngajamento("Alto");
  const medio = contarEngajamento("Médio");
  const baixo = contarEngajamento("Baixo");
  const totalClassificados = verde + amarelo + vermelho;
  const totalEngajamento = alto + medio + baixo;

  function calcularPercentuais100(valores) {
    const total = valores.reduce((soma, valor) => soma + valor, 0);
    if (!total) return valores.map(() => 0);
    const exatos = valores.map((valor) => (valor / total) * 100);
    const inteiros = exatos.map((valor) => Math.floor(valor));
    let faltam = 100 - inteiros.reduce((soma, valor) => soma + valor, 0);
    const ordem = exatos.map((valor, indice) => ({ indice, resto: valor - inteiros[indice] })).sort((a, b) => b.resto - a.resto);
    for (let i = 0; i < faltam; i += 1) inteiros[ordem[i % ordem.length].indice] += 1;
    return inteiros;
  }

  const [percentualVerde, percentualAmarelo, percentualVermelho] = calcularPercentuais100([verde, amarelo, vermelho]);
  const [percentualAlto, percentualMedio, percentualBaixo] = calcularPercentuais100([alto, medio, baixo]);

  function corIndicador(label) {
    if (label === "VERDE" || label === "Alto" || label === "Positivo") return "#22c55e";
    if (label === "AMARELO" || label === "Médio" || label === "Positivo com ressalvas") return "#facc15";
    if (label === "VERMELHO" || label === "Baixo" || label === "Negativo") return "#ef4444";
    return "#60a5fa";
  }

  function listaFiltrada() {
    if (!filtroAtivo) return [];
    const lista = [];
    if (typeof filtroAtivo === "object" && filtroAtivo.tipo === "percepcao") {
      baseAtual.forEach((r) => {
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
      return lista.sort((a, b) => String(a.escola || "").localeCompare(String(b.escola || ""), "pt-BR"));
    }

    baseAtual.forEach((r) => {
      if (["VERDE", "AMARELO", "VERMELHO"].includes(filtroAtivo)) {
        if (r.classificacaoDiretor === filtroAtivo) lista.push({ id: `${r.id}-d`, nome: r.diretor || "Não informado", cargo: "Diretor(a)", municipio: r.municipio, escola: r.escola, classificacao: r.classificacaoDiretor, engajamento: r.interesseAgendaDiretor });
        if (r.classificacaoAdjunto === filtroAtivo) lista.push({ id: `${r.id}-a`, nome: r.adjunto || "Não informado", cargo: "Diretor(a) Adjunto(a)", municipio: r.municipio, escola: r.escola, classificacao: r.classificacaoAdjunto, engajamento: r.interesseAgendaAdjunto });
      } else {
        if (r.interesseAgendaDiretor === filtroAtivo) lista.push({ id: `${r.id}-ed`, nome: r.diretor || "Não informado", cargo: "Diretor(a)", municipio: r.municipio, escola: r.escola, classificacao: r.classificacaoDiretor, engajamento: r.interesseAgendaDiretor });
        if (r.interesseAgendaAdjunto === filtroAtivo) lista.push({ id: `${r.id}-ea`, nome: r.adjunto || "Não informado", cargo: "Diretor(a) Adjunto(a)", municipio: r.municipio, escola: r.escola, classificacao: r.classificacaoAdjunto, engajamento: r.interesseAgendaAdjunto });
      }
    });
    return lista.sort((a, b) => String(a.escola || "").localeCompare(String(b.escola || ""), "pt-BR"));
  }

  function barraVertical(label, valor, totalBase, aoClicar, percentualAjustado = null) {
    const percentual = percentualAjustado !== null ? percentualAjustado : totalBase ? Math.round((valor / totalBase) * 100) : 0;
    const cor = corIndicador(label);
    return (
      <div className="chart-col" onClick={aoClicar || (() => setFiltroAtivo(label))}>
        <div style={{ color: cor, fontWeight: 950, fontSize: 20 }}>{percentual}%</div>
        <div className="chart-track">
          <div className="chart-bar" style={{ height: `${percentual}%`, background: cor, boxShadow: `0 0 16px ${cor}55` }} />
        </div>
        <div style={{ color: cor, fontWeight: 950, fontSize: 19 }}>({valor})</div>
        <div style={{ color: cor, fontWeight: 900, textAlign: "center", fontSize: label === "Positivo com ressalvas" ? 11 : 13 }}>{label}</div>
      </div>
    );
  }

  function barraHorizontal(label, valor, totalBase) {
    const percentual = totalBase ? Math.round((valor / totalBase) * 100) : 0;
    return (
      <div className="chart-horizontal-item">
        <div className="chart-horizontal-text"><span>{label}</span><strong>{valor} ({percentual}%)</strong></div>
        <div className="chart-horizontal-track"><div className="chart-horizontal-bar" style={{ width: `${percentual}%` }} /></div>
      </div>
    );
  }

  function graficoCheckbox(titulo, campo, opcoes) {
    return (
      <section className="chart-panel">
        <h4 style={{ marginTop: 0 }}>{titulo}</h4>
        {opcoes.map((opcao) => <div key={opcao}>{barraHorizontal(opcao, contarArray(campo, opcao), totalFormularios)}</div>)}
      </section>
    );
  }

  function graficoPercepcao(titulo, campo) {
    const valores = percepcaoOpcoes.map((opcao) => contarPercepcao(campo, opcao));
    const totalRespondidos = valores.reduce((soma, valor) => soma + valor, 0);
    const percentuais = calcularPercentuais100(valores);
    return (
      <section className="chart-panel">
        <h4 style={{ marginTop: 0, textAlign: "center" }}>{titulo}</h4>
        <div className="chart-vertical">
          {percepcaoOpcoes.map((opcao, indice) => barraVertical(opcao, valores[indice], totalRespondidos, () => setFiltroAtivo({ tipo: "percepcao", label: opcao, campo, titulo }), percentuais[indice]))}
        </div>
      </section>
    );
  }

  function RadarMark({ compact = false }) {
    return (
      <div className={`radar-mark ${compact ? "compact" : ""}`} aria-hidden="true">
        <span className="radar-ring inner" />
        <span className="radar-ring outer" />
        <span className="radar-core" />
        <span className="radar-dot" />
      </div>
    );
  }

  function BrandBar() {
    return (
      <>
        <div className="radar-brandbar no-print">
          <div className="radar-brand">
            <RadarMark />
            <div>
              <h1>Radar Link MS</h1>
              <p>CRE-5 • Gestão educacional • Mato Grosso do Sul</p>
            </div>
          </div>
          <div className="status-pill"><span className="status-dot" /> Base de dados atualizada</div>
        </div>
        {erroSistema && <div className="alert-error">⚠️ {erroSistema}</div>}
      </>
    );
  }

  function NavIcon({ tipo }) {
    const common = {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.9,
      strokeLinecap: "round",
      strokeLinejoin: "round"
    };

    if (tipo === "inicio") return <svg {...common}><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-6h5v6"/></svg>;
    if (tipo === "formularios") return <svg {...common}><path d="M7 3h10a2 2 0 0 1 2 2v16H5V5a2 2 0 0 1 2-2Z"/><path d="M8 7h8M8 11h8M8 15h5"/><path d="m15.5 17.5 1.5 1.5 3-3"/></svg>;
    if (tipo === "graficos") return <svg {...common}><path d="M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7"/><path d="M3 20h18"/></svg>;
    if (tipo === "politico") return <svg {...common}><path d="M4 9h16M6 9V7l6-4 6 4v2M6 9v9M10 9v9M14 9v9M18 9v9M4 18h16M3 21h18"/></svg>;
    if (tipo === "dobradinha") return <svg {...common}><path d="M8.5 12.5 11 15a2 2 0 0 0 3 0l4-4a2.8 2.8 0 0 0-4-4l-1 1"/><path d="m15.5 11.5-2.5-2.5a2 2 0 0 0-3 0l-4 4a2.8 2.8 0 0 0 4 4l1-1"/><path d="m9.5 14.5 5-5"/></svg>;
    if (tipo === "relatorio") return <svg {...common}><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6M9 19h4"/></svg>;
    return <svg {...common}><path d="M9 4h6M8 7h8l-1 14H9L8 7Z"/><path d="M10 10v7M14 10v7"/></svg>;
  }

  function NavPrincipal() {
    const itens = [
      { id: "inicio", label: "Painel", sub: "Visão geral" },
      { id: "formularios", label: "Formulários", sub: "Cadastro técnico" },
      { id: "graficos", label: "Indicadores", sub: "Resultados" },
      { id: "politico", label: "Cenário Político", sub: "Base regional" },
      { id: "dobradinha", label: "Dobradinha", sub: "Estadual + Federal" },
      { id: "relatorio", label: "Relatório", sub: "Impressão / PDF" }
    ];
    return (
      <nav className="radar-nav no-print" aria-label="Navegação principal">
        {itens.map((item) => (
          <button key={item.id} className={`nav-btn ${tela === item.id ? "active" : ""}`} onClick={() => navegar(item.id)}>
            <span className="nav-icon" aria-hidden="true"><NavIcon tipo={item.id} /></span>
            <span className="nav-label-wrap">
              <span className="nav-label">{item.label}</span>
              <span className="nav-sub">{item.sub}</span>
            </span>
          </button>
        ))}
        <button className="nav-btn logout" onClick={sairDaPlataforma}>
          <span className="nav-icon" aria-hidden="true"><NavIcon tipo="sair" /></span>
          <span className="nav-label-wrap">
            <span className="nav-label">Sair</span>
            <span className="nav-sub">Encerrar acesso</span>
          </span>
        </button>
      </nav>
    );
  }

  function Kpi({ label, value, note }) {
    return <div className="kpi-card"><span className="kpi-label">{label}</span><div className="kpi-value">{value}</div>{note && <div className="kpi-note">{note}</div>}</div>;
  }

  function TelaLogin() {
    return (
      <div className="login-page">
        <style>{GLOBAL_CSS}</style>
        <div className="login-box">
          <div className="login-logo-wrap"><RadarMark compact /></div>
          <div className="eyebrow">Acesso restrito</div>
          <h1>Radar Link MS</h1>
          <p>Plataforma estratégica de gestão regional e acompanhamento de cenários.</p>
          <input className="input" type="password" placeholder="Digite a senha" value={senhaDigitada} onChange={(e) => setSenhaDigitada(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") entrarNaPlataforma(); }} autoFocus />
          <button className="btn primary full" style={{ marginTop: 12 }} onClick={entrarNaPlataforma}>Entrar na plataforma</button>
        </div>
      </div>
    );
  }

  function TelaInicio() {
    const totalEstaduais = totalDeputados(deputadosEstaduais);
    const totalFederais = totalDeputados(deputadosFederais);
    return (
      <StableShell brand={BrandBar()} nav={NavPrincipal()}>
        <section className="hero">
          <div className="eyebrow">Painel executivo</div>
          <h2>Painel Regional CRE-5</h2>
          <p>Gestão, inteligência regional e consolidação de dados em um dashboard executivo de alta legibilidade para acompanhamento da CRE-5.</p>
          <div className="kpi-grid">
            <Kpi label="Formulários salvos" value={registros.length} note="Firestore" />
            <Kpi label="Gestores na base Word" value={gestoresPoliticosBase.length} note={`${gestoresPoliticosBase.filter((g) => g.cargo === "Diretor").length} diretores • ${gestoresPoliticosBase.filter((g) => g.cargo === "Adjunto").length} adjuntos`} />
            <Kpi label="Apoios estaduais" value={totalEstaduais} note="Oposição separada" />
            <Kpi label="Apoios federais" value={totalFederais} note="Oposição separada" />
            <Kpi label="Dobradinhas" value={dobradinhasBase.length} note="Combinações únicas" />
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <div><h3>Formulário de reunião com gestores</h3><p>Cadastro técnico com demandas, percepção institucional, engajamento e classificação.</p></div>
            {editandoId && <div className="notice">✏️ Editando formulário salvo — as alterações permanecem nesta posição enquanto você digita.</div>}
          </div>

          <div className="form-section">
            <h4>1. Identificação</h4>
            <div className="field-grid cols-3">
              <div><label className="field-label">Município</label><select className="input" value={form.municipio} onChange={(e) => setForm({ ...form, municipio: e.target.value, escola: "" })}><option value="">Selecione</option>{Object.keys(escolasPorMunicipio).sort((a,b)=>a.localeCompare(b,"pt-BR")).map((municipio) => <option key={municipio}>{municipio}</option>)}</select></div>
              <div><label className="field-label">Escola</label><select className="input" value={form.escola} onChange={(e) => setForm({ ...form, escola: e.target.value })}><option value="">Selecione</option>{form.municipio && escolasPorMunicipio[form.municipio]?.map((escola) => <option key={escola}>{escola}</option>)}</select></div>
              <div><label className="field-label">Data</label><input className="input" type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
              <div><label className="field-label">Classificação da escola</label><select className="input" value={form.classificacaoEscola} onChange={(e) => setForm({ ...form, classificacaoEscola: e.target.value })}><option value="">Selecione</option><option>1</option><option>2</option><option>3</option><option>4</option></select></div>
              <div><label className="field-label">Diretor(a)</label><input className="input" placeholder="Nome" value={form.diretor} onChange={(e) => setForm({ ...form, diretor: e.target.value })} /></div>
              <div><label className="field-label">Diretor(a) adjunto(a)</label><input className="input" placeholder="Nome" value={form.adjunto} onChange={(e) => setForm({ ...form, adjunto: e.target.value })} /></div>
            </div>
          </div>

          <div className="form-section">
            <h4>2. Demandas da escola</h4>
            <div className="check-grid">{demandasOpcoes.map((opcao) => <label className="check-chip" key={opcao}><input type="checkbox" checked={form.demandas.includes(opcao)} onChange={() => alternarCheckbox("demandas", opcao)} /> {opcao}</label>)}</div>
            <textarea className="input" style={{ marginTop: 12 }} placeholder="Descrição das demandas" value={form.descricaoDemandas} onChange={(e) => setForm({ ...form, descricaoDemandas: e.target.value })} />
          </div>

          <div className="form-section">
            <h4>3. Questões administrativas</h4>
            <div className="check-grid">{administrativasOpcoes.map((opcao) => <label className="check-chip" key={opcao}><input type="checkbox" checked={form.administrativas.includes(opcao)} onChange={() => alternarCheckbox("administrativas", opcao)} /> {opcao}</label>)}</div>
            <textarea className="input" style={{ marginTop: 12 }} placeholder="Descrição das questões administrativas" value={form.descricaoAdministrativas} onChange={(e) => setForm({ ...form, descricaoAdministrativas: e.target.value })} />
          </div>

          <div className="form-section">
            <h4>4. Percepção institucional</h4>
            <div className="field-grid">
              {[["Diretor(a): avaliação da SED", "avaliacaoSedDiretor"],["Diretor(a): avaliação do Governo", "avaliacaoGovernoDiretor"],["Adjunto(a): avaliação da SED", "avaliacaoSedAdjunto"],["Adjunto(a): avaliação do Governo", "avaliacaoGovernoAdjunto"]].map(([titulo, campo]) => <div key={campo}><label className="field-label">{titulo}</label><select className="input" value={form[campo]} onChange={(e) => setForm({ ...form, [campo]: e.target.value })}><option value="">Selecione</option>{percepcaoOpcoes.map((opcao) => <option key={opcao}>{opcao}</option>)}</select></div>)}
            </div>
          </div>

          <div className="form-section">
            <h4>5. Engajamento e classificação interna</h4>
            <div className="field-grid">
              <div><label className="field-label">Interesse do diretor</label><select className="input" value={form.interesseAgendaDiretor} onChange={(e) => setForm({ ...form, interesseAgendaDiretor: e.target.value })}><option value="">Selecione</option><option>Alto</option><option>Médio</option><option>Baixo</option></select></div>
              <div><label className="field-label">Interesse do adjunto</label><select className="input" value={form.interesseAgendaAdjunto} onChange={(e) => setForm({ ...form, interesseAgendaAdjunto: e.target.value })}><option value="">Selecione</option><option>Alto</option><option>Médio</option><option>Baixo</option></select></div>
              <div><label className="field-label">Classificação do diretor</label><select className="input" value={form.classificacaoDiretor} onChange={(e) => setForm({ ...form, classificacaoDiretor: e.target.value })}><option value="">Selecione</option><option>VERDE</option><option>AMARELO</option><option>VERMELHO</option></select></div>
              <div><label className="field-label">Classificação do adjunto</label><select className="input" value={form.classificacaoAdjunto} onChange={(e) => setForm({ ...form, classificacaoAdjunto: e.target.value })}><option value="">Selecione</option><option>VERDE</option><option>AMARELO</option><option>VERMELHO</option></select></div>
            </div>
          </div>

          <div className="form-section">
            <h4>6. Observações estratégicas</h4>
            <div className="field-grid">
              <div><label className="field-label">Diretor(a)</label><textarea className="input" placeholder="Observações do diretor(a)" value={form.observacoesDiretor} onChange={(e) => setForm({ ...form, observacoesDiretor: e.target.value })} /></div>
              <div><label className="field-label">Adjunto(a)</label><textarea className="input" placeholder="Observações do adjunto(a)" value={form.observacoesAdjunto} onChange={(e) => setForm({ ...form, observacoesAdjunto: e.target.value })} /></div>
            </div>
          </div>

          <div className="actions">
            <button className="btn primary" onClick={salvarRegistro}>{editandoId ? "Salvar alterações" : "Salvar reunião"}</button>
            {editandoId && <button className="btn secondary" onClick={() => { setForm(formLimpo); setEditandoId(null); }}>Cancelar edição</button>}
          </div>
        </section>
      </StableShell>
    );
  }

  function CardDeputado({ item }) {
    const perfil = perfilCandidato(item.deputado);
    const nomeExibicao = nomeCandidatoExibicao(perfil.nome, true);
    const tamanhoNome = nomeExibicao.length > 20 ? "long" : nomeExibicao.length > 14 ? "medium" : "short";
    const semNumero = !perfil.numero || perfil.numero === "—";
    const municipios = new Set(registrosDoDeputado(item).map((registro) => registro.cidade).filter(Boolean)).size;

    return (
      <button className="candidate-card" onClick={() => { setDetalhePolitico(item); rolarParaTopo(); }}>
        <div className="candidate-card-head">
          <span className="candidate-role-pill">{item.tipo === "Estadual" ? "Deputado Estadual" : item.tipo === "Federal" ? "Deputado Federal" : item.tipo}</span>
          <div className="candidate-total-box"><strong>{item.total}</strong><span>gestores</span></div>
        </div>

        <div className="candidate-card-main">
          <div className={`candidate-card-name ${tamanhoNome}`}>{nomeExibicao}</div>
          <div className="candidate-card-meta">
            <span className={`candidate-card-number ${semNumero ? "muted" : ""}`}>{semNumero ? "SEM NÚMERO" : `Nº ${perfil.numero}`}</span>
            {perfil.partido ? <span className="candidate-card-party">{perfil.partido}</span> : null}
          </div>
        </div>

        <div className="candidate-card-stats">
          <div className="candidate-stat"><strong>{item.diretores}</strong><span>Diretores</span></div>
          <div className="candidate-stat"><strong>{item.adjuntos}</strong><span>Adjuntos</span></div>
          <div className="candidate-stat"><strong>{municipios}</strong><span>Municípios</span></div>
        </div>
        <div className="candidate-card-action">Ver rede de apoio <span>→</span></div>
      </button>
    );
  }

  function ListaPessoas({ registrosLista }) {
    const grupos = registrosLista.reduce((mapa, registro) => {
      if (!mapa[registro.cidade]) mapa[registro.cidade] = [];
      mapa[registro.cidade].push(registro);
      return mapa;
    }, {});

    const cidadesOrdenadas = Object.keys(grupos).sort((a, b) =>
      String(a).localeCompare(String(b), "pt-BR", { sensitivity: "base" })
    );

    return cidadesOrdenadas.map((cidade) => {
      const registrosOrdenados = [...grupos[cidade]].sort((a, b) =>
        String(a.escola || "").localeCompare(String(b.escola || ""), "pt-BR", { sensitivity: "base" }) ||
        String(a.cargo || "").localeCompare(String(b.cargo || ""), "pt-BR", { sensitivity: "base" }) ||
        String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR", { sensitivity: "base" })
      );

      return (
        <section className="detail-city" key={cidade}>
          <div className="detail-city-head"><h4>{cidade}</h4><span className="type-tag">{registrosOrdenados.length} gestores</span></div>
          <div className="people-grid">
            {registrosOrdenados.map((registro, indice) => {
              const link = whatsappLink(registro.telefone);
              return <div className="person-card" key={`${cidade}-${registro.escola}-${registro.nome}-${indice}`}>
                <div className="school">{registro.escola}</div><div className="role">{registro.cargo}</div><div className="person-name">{registro.nome}</div>
                {link ? <a className="wa" href={link} target="_blank" rel="noreferrer">💬 {registro.telefone} · WhatsApp</a> : <div className="phone-off">Telefone não informado</div>}
              </div>;
            })}
          </div>
        </section>
      );
    });
  }

  function TelaPolitica() {
    if (detalhePolitico) {
      const lista = registrosDoDeputado(detalhePolitico);
      const municipios = new Set(lista.map((r) => r.cidade)).size;
      return <StableShell brand={BrandBar()} nav={NavPrincipal()}>
        <section className="hero">
          <div className="candidate-detail-head">
            <CandidateIdentity nome={detalhePolitico.deputado} />
            <div className="candidate-detail-copy">
              <div className="eyebrow">{detalhePolitico.tipo} · cenário 2026</div>
              <h2>{perfilCandidato(detalhePolitico.deputado).nome}</h2>
              <p>Lista do cenário político organizada por município, escola e cargo.</p>
            </div>
          </div>
          <div className="kpi-grid"><Kpi label="Total" value={detalhePolitico.total}/><Kpi label="Diretores" value={detalhePolitico.diretores}/><Kpi label="Adjuntos" value={detalhePolitico.adjuntos}/><Kpi label="Municípios" value={municipios}/><Kpi label="Base" value="Word" note="Anexos atuais"/></div>
        </section>
        <section className="panel"><div className="actions no-print"><button className="btn secondary" onClick={() => setDetalhePolitico(null)}>← Voltar</button><button className="btn primary" onClick={gerarPDF}>Imprimir / Salvar PDF</button></div><ListaPessoas registrosLista={lista} /></section>
      </StableShell>;
    }

    const totalEstaduais = totalDeputados(deputadosEstaduais);
    const totalFederais = totalDeputados(deputadosFederais);
    return <StableShell brand={BrandBar()} nav={NavPrincipal()}>
      <section className="hero">
        <div className="eyebrow">Cenário político — simulação</div><h2>Mapa de apoios da CRE-5</h2><p>Dados separados por deputado estadual e federal, calculados diretamente da base consolidada dos dois anexos Word. Registros classificados como oposição ficam separados da contagem de apoio.</p>
        <div className="kpi-grid"><Kpi label="Deputados estaduais" value={deputadosEstaduais.length}/><Kpi label="Apoios estaduais" value={totalEstaduais}/><Kpi label="Deputados federais" value={deputadosFederais.length}/><Kpi label="Apoios federais" value={totalFederais}/><Kpi label="Gestores na base" value={gestoresPoliticosBase.length}/></div>
        <div className="filter-row no-print"><input className="input" placeholder="Buscar deputado..." value={buscaPolitica} onChange={(e)=>setBuscaPolitica(e.target.value)}/><button className="btn secondary" onClick={gerarPDF}>Imprimir painel</button></div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div><h3>Deputados estaduais</h3><p>Ordenados pela quantidade de gestores • Diretores: {totalDiretoresDeputados(deputadosEstaduais)} • Adjuntos: {totalAdjuntosDeputados(deputadosEstaduais)}</p></div>
          <span className="section-count">{deputadosEstaduaisFiltrados.length} candidatos</span>
        </div>
        <div className="politico-grid">{deputadosEstaduaisFiltrados.map((item)=><CardDeputado key={`EST-${item.deputado}`} item={item}/>)}</div>
      </section>
      <section className="panel">
        <div className="section-heading">
          <div><h3>Deputados federais</h3><p>Ordenados pela quantidade de gestores • Diretores: {totalDiretoresDeputados(deputadosFederais)} • Adjuntos: {totalAdjuntosDeputados(deputadosFederais)}</p></div>
          <span className="section-count">{deputadosFederaisFiltrados.length} candidatos</span>
        </div>
        <div className="politico-grid">{deputadosFederaisFiltrados.map((item)=><CardDeputado key={`FED-${item.deputado}`} item={item}/>)}</div>
      </section>
      {(oposicaoEstadual || oposicaoFederal) && <section className="panel">
        <div className="section-heading"><div><h3>Registros de oposição</h3><p>Exibidos separadamente e não somados como apoio a deputado.</p></div></div>
        <div className="politico-grid">{oposicaoEstadual && <CardDeputado item={oposicaoEstadual}/>} {oposicaoFederal && <CardDeputado item={oposicaoFederal}/>}</div>
      </section>}
    </StableShell>;
  }

  function PairStatus({ item }) {
    const completa = item.estadual !== "Não informado" && item.federal !== "Não informado";
    const oposicao = item.estadual === "Oposição" || item.federal === "Oposição";
    if (oposicao) return <span className="opposition-tag">CONTÉM OPOSIÇÃO</span>;
    return completa ? <span className="complete-tag">DOBRADINHA COMPLETA</span> : <span className="partial-tag">APOIO PARCIAL</span>;
  }

  function TelaDobradinha() {
    if (detalheDobradinha) {
      return <StableShell brand={BrandBar()} nav={NavPrincipal()}>
        <section className="hero">
          <div className="eyebrow">Dobradinha · cenário consolidado</div>
          <div className="double-pair" style={{ margin: "14px auto 0", width: "min(900px, 100%)" }}>
            <div className="candidate-box"><span className="candidate-label">Estadual</span><CandidateIdentity nome={detalheDobradinha.estadual} /></div>
            <div className="pair-plus" aria-label="e">&amp;</div>
            <div className="candidate-box"><span className="candidate-label">Federal</span><CandidateIdentity nome={detalheDobradinha.federal} /></div>
          </div>
          <p style={{ marginTop: 14 }}>Gestores que repetem a mesma combinação estadual/federal. Quando um dos lados não está informado no Word, o agrupamento é mantido como apoio parcial.</p>
          <div className="kpi-grid"><Kpi label="Gestores" value={detalheDobradinha.total}/><Kpi label="Diretores" value={detalheDobradinha.diretores}/><Kpi label="Adjuntos" value={detalheDobradinha.adjuntos}/><Kpi label="Municípios" value={detalheDobradinha.municipios.length}/><Kpi label="Situação" value={detalheDobradinha.estadual !== "Não informado" && detalheDobradinha.federal !== "Não informado" ? "Completa" : "Parcial"}/></div>
        </section>
        <section className="panel"><div className="actions no-print"><button className="btn secondary" onClick={()=>setDetalheDobradinha(null)}>← Voltar</button><button className="btn primary" onClick={gerarPDF}>Imprimir / Salvar PDF</button></div><ListaPessoas registrosLista={detalheDobradinha.registros}/></section>
      </StableShell>;
    }

    const totalRepresentado = dobradinhasBase.reduce((soma,item)=>soma+item.total,0);
    const completas = dobradinhasBase.filter((item)=>item.estadual !== "Não informado" && item.federal !== "Não informado");
    const parciais = dobradinhasBase.filter((item)=>item.estadual === "Não informado" || item.federal === "Não informado");

    return <StableShell brand={BrandBar()} nav={NavPrincipal()}>
      <section className="hero">
        <div className="eyebrow">Nova aba</div><h2>Dobradinha estadual + federal</h2><p>Agrupamento automático dos gestores que têm a mesma combinação de deputado estadual e federal. Se apenas um lado estiver preenchido nos documentos, o registro também é agregado e identificado como parcial.</p>
        <div className="kpi-grid"><Kpi label="Combinações únicas" value={dobradinhasBase.length}/><Kpi label="Dobradinhas completas" value={completas.length}/><Kpi label="Apoios parciais" value={parciais.length}/><Kpi label="Gestores representados" value={totalRepresentado}/><Kpi label="Sem indicação nos dois lados" value={gestoresPoliticosBase.length-totalRepresentado}/></div>
        <div className="filter-row no-print"><input className="input" placeholder="Buscar estadual ou federal..." value={buscaDobradinha} onChange={(e)=>setBuscaDobradinha(e.target.value)}/><select className="input" value={filtroDobradinha} onChange={(e)=>setFiltroDobradinha(e.target.value)}><option value="TODAS">Todas</option><option value="COMPLETAS">Somente completas</option><option value="PARCIAIS">Somente parciais</option></select></div>
      </section>

      <section className="panel">
        <div className="section-heading"><div><h3>Combinações consolidadas</h3><p>Ordenadas alfabeticamente pelo deputado estadual e, em seguida, pelo federal.</p></div><button className="btn secondary no-print" onClick={gerarPDF}>Imprimir painel</button></div>
        <div className="cards-grid">
          {dobradinhasFiltradas.map((item)=><button className="double-card" key={item.chave} onClick={()=>{ setDetalheDobradinha(item); rolarParaTopo(); }}>
            <div className="card-top"><PairStatus item={item}/><div className="count-badge">{item.total}</div></div>
            <div className="double-pair">
              <div className="candidate-box"><span className="candidate-label">Estadual</span><CandidateIdentity nome={item.estadual} compact /></div>
              <div className="pair-plus" aria-label="e">&amp;</div>
              <div className="candidate-box"><span className="candidate-label">Federal</span><CandidateIdentity nome={item.federal} compact /></div>
            </div>
            <div className="card-stats"><span>Diretores: <strong>{item.diretores}</strong></span><span>Adjuntos: <strong>{item.adjuntos}</strong></span><span>Municípios: <strong>{item.municipios.length}</strong></span></div>
          </button>)}
        </div>
        {dobradinhasFiltradas.length===0 && <div className="notice">Nenhuma combinação encontrada com os filtros atuais.</div>}
      </section>
    </StableShell>;
  }

  function TelaGraficos() {
    return <StableShell brand={BrandBar()} nav={NavPrincipal()}>
      <section className="hero"><div className="eyebrow">Indicadores</div><h2>Resultados e percepção institucional</h2><p>Indicadores calculados a partir dos formulários salvos no Firestore.</p><div className="kpi-grid"><Kpi label="Formulários" value={totalFormularios}/><Kpi label="Gestores avaliados" value={totalGestoresAvaliados}/><Kpi label="Classificados" value={totalClassificados}/><Kpi label="Com engajamento" value={totalEngajamento}/><Kpi label="Filtro" value={municipioIndicador === "GERAL" ? "Geral" : municipioIndicador}/></div><div className="filter-row no-print"><select className="input" value={municipioIndicador} onChange={(e)=>setMunicipioIndicador(e.target.value)}><option value="GERAL">Indicadores gerais</option>{Object.keys(escolasPorMunicipio).sort((a,b)=>a.localeCompare(b,"pt-BR")).map((m)=><option key={m}>{m}</option>)}</select><button className="btn secondary" onClick={gerarPDF}>Imprimir gráficos</button></div></section>
      <section className="panel"><div className="section-heading"><div><h3>Classificação</h3><p>Clique em uma barra para abrir a lista.</p></div></div><div className="chart-panel"><div className="chart-vertical">{barraVertical("VERDE",verde,totalClassificados,null,percentualVerde)}{barraVertical("AMARELO",amarelo,totalClassificados,null,percentualAmarelo)}{barraVertical("VERMELHO",vermelho,totalClassificados,null,percentualVermelho)}</div></div><div className="section-heading"><div><h3>Engajamento</h3></div></div><div className="chart-panel"><div className="chart-vertical">{barraVertical("Alto",alto,totalEngajamento,null,percentualAlto)}{barraVertical("Médio",medio,totalEngajamento,null,percentualMedio)}{barraVertical("Baixo",baixo,totalEngajamento,null,percentualBaixo)}</div></div><div className="section-heading"><div><h3>Demandas</h3></div></div>{graficoCheckbox("Demandas da Escola","demandas",demandasOpcoes)}{graficoCheckbox("Questões Administrativas","administrativas",administrativasOpcoes)}<div className="section-heading"><div><h3>Percepção institucional</h3></div></div>{graficoPercepcao("Diretor(a): Como avalia a SED?","avaliacaoSedDiretor")}{graficoPercepcao("Diretor(a): Como avalia o Governo?","avaliacaoGovernoDiretor")}{graficoPercepcao("Adjunto(a): Como avalia a SED?","avaliacaoSedAdjunto")}{graficoPercepcao("Adjunto(a): Como avalia o Governo?","avaliacaoGovernoAdjunto")}</section>
    </StableShell>;
  }

  function TelaFormularios() {
    return <StableShell brand={BrandBar()} nav={NavPrincipal()}>
      <section className="hero"><div className="eyebrow">Arquivo operacional</div><h2>Formulários salvos</h2><p>Consulta, edição, impressão e exclusão dos registros armazenados no Firestore.</p><div className="kpi-grid"><Kpi label="Total" value={registrosOrdenados.length}/><Kpi label="Municípios" value={new Set(registrosOrdenados.map((r)=>r.municipio).filter(Boolean)).size}/><Kpi label="Com diretor" value={registrosOrdenados.filter((r)=>r.diretor).length}/><Kpi label="Com adjunto" value={registrosOrdenados.filter((r)=>r.adjunto).length}/><Kpi label="Banco" value="Firestore"/></div></section>
      <section className="panel"><div className="actions no-print"><button className="btn secondary" onClick={gerarPDF}>Imprimir lista</button></div>{registrosOrdenados.length===0 && <div className="notice">Nenhum formulário salvo ainda.</div>}{registrosOrdenados.map((r)=><div className="list-card" key={r.id}><h4>{r.escola}</h4><p><strong>Município:</strong> {r.municipio}</p><p><strong>Classificação:</strong> {r.classificacaoEscola || "Não informada"}</p><p><strong>Diretor:</strong> {r.diretor || "Não informado"}</p><p><strong>Adjunto:</strong> {r.adjunto || "Não informado"}</p><div className="actions no-print"><button className="btn primary" onClick={()=>setFormAberto(r)}>Abrir</button><button className="btn secondary" onClick={()=>editarFormulario(r)}>Editar</button><button className="btn secondary" onClick={()=>imprimirFormulario(r)}>Imprimir</button><button className="btn danger" onClick={()=>excluirRegistro(r.id)}>Excluir</button></div></div>)}</section>
    </StableShell>;
  }

  function TelaFormularioAberto() {
    return <div className="report-page"><style>{GLOBAL_CSS}</style><h1>Radar Link MS</h1><h2>Formulário salvo</h2><div className="actions no-print"><button className="btn secondary" onClick={()=>setFormAberto(null)}>Voltar</button><button className="btn primary" onClick={gerarPDF}>Imprimir / Salvar PDF</button><button className="btn secondary" onClick={()=>editarFormulario(formAberto)}>Editar</button></div>
      <section className="report-box"><h3>Dados da reunião</h3><p><strong>Município:</strong> {formAberto.municipio}</p><p><strong>Escola:</strong> {formAberto.escola}</p><p><strong>Classificação da Escola:</strong> {formAberto.classificacaoEscola || "Não informada"}</p><p><strong>Data:</strong> {formAberto.data || "Não informada"}</p><p><strong>Diretor(a):</strong> {formAberto.diretor || "Não informado"}</p><p><strong>Adjunto(a):</strong> {formAberto.adjunto || "Não informado"}</p></section>
      <section className="report-box"><h3>Demandas</h3><p><strong>Marcadas:</strong> {formAberto.demandas?.join(", ") || "Nenhuma"}</p><p><strong>Descrição:</strong> {formAberto.descricaoDemandas || "Sem descrição"}</p></section>
      <section className="report-box"><h3>Questões administrativas</h3><p><strong>Marcadas:</strong> {formAberto.administrativas?.join(", ") || "Nenhuma"}</p><p><strong>Descrição:</strong> {formAberto.descricaoAdministrativas || "Sem descrição"}</p></section>
      <section className="report-box"><h3>Percepção institucional</h3><p><strong>SED - Diretor:</strong> {formAberto.avaliacaoSedDiretor || "Não informado"}</p><p><strong>Governo - Diretor:</strong> {formAberto.avaliacaoGovernoDiretor || "Não informado"}</p><p><strong>SED - Adjunto:</strong> {formAberto.avaliacaoSedAdjunto || "Não informado"}</p><p><strong>Governo - Adjunto:</strong> {formAberto.avaliacaoGovernoAdjunto || "Não informado"}</p></section>
      <section className="report-box"><h3>Engajamento e classificação</h3><p><strong>Engajamento Diretor:</strong> {formAberto.interesseAgendaDiretor || "Não informado"}</p><p><strong>Engajamento Adjunto:</strong> {formAberto.interesseAgendaAdjunto || "Não informado"}</p><p><strong>Classificação Diretor:</strong> {formAberto.classificacaoDiretor || "Não informado"}</p><p><strong>Classificação Adjunto:</strong> {formAberto.classificacaoAdjunto || "Não informado"}</p></section>
      <section className="report-box"><h3>Observações estratégicas</h3><p><strong>Diretor(a):</strong> {formAberto.observacoesDiretor || "Sem observações"}</p><p><strong>Adjunto(a):</strong> {formAberto.observacoesAdjunto || "Sem observações"}</p></section>
      <button className="btn danger no-print" onClick={()=>excluirRegistro(formAberto.id)}>Excluir este formulário</button>
    </div>;
  }

  function TelaListaFiltro() {
    const lista = listaFiltrada();
    const filtroLabel = typeof filtroAtivo === "object" ? filtroAtivo.label : filtroAtivo;
    const filtroTitulo = typeof filtroAtivo === "object" ? filtroAtivo.titulo : `Lista: ${filtroLabel}`;
    const cor = corIndicador(filtroLabel);
    return <StableShell brand={BrandBar()} nav={NavPrincipal()}><section className="hero"><div className="eyebrow">Detalhamento do indicador</div><h2 style={{color:cor}}>{filtroTitulo}</h2><p>{filtroLabel}</p></section><section className="panel"><div className="actions no-print"><button className="btn secondary" onClick={()=>setFiltroAtivo(null)}>← Voltar</button></div>{lista.length===0 && <div className="notice">Nenhum registro encontrado.</div>}{lista.map((r)=><div className="list-card" key={r.id} style={{borderLeft:`5px solid ${cor}`}}><h4>{r.nome}</h4><p><strong>Cargo:</strong> {r.cargo}</p><p><strong>Município:</strong> {r.municipio}</p><p><strong>Escola:</strong> {r.escola}</p>{r.percepcao && <p><strong>Percepção:</strong> {r.percepcao}</p>}{r.classificacao && <p><strong>Classificação:</strong> {r.classificacao}</p>}{r.engajamento && <p><strong>Engajamento:</strong> {r.engajamento}</p>}</div>)}</section></StableShell>;
  }

  function TelaRelatorio() {
    return <div className="report-page"><style>{GLOBAL_CSS}</style><h1>Radar Link MS</h1><h2>Relatório Estratégico de Gestores</h2><p><strong>Filtro:</strong> {municipioIndicador === "GERAL" ? "Geral" : municipioIndicador}</p><p><strong>Data de geração:</strong> {new Date().toLocaleString("pt-BR")}</p><div className="actions no-print"><button className="btn secondary" onClick={()=>navegar("inicio")}>Voltar ao painel</button><button className="btn primary" onClick={gerarPDF}>Gerar PDF / Imprimir</button></div>
      <section className="report-box"><h3>1. Totais por Classificação</h3><p><strong>Verde:</strong> {verde}</p><p><strong>Amarelo:</strong> {amarelo}</p><p><strong>Vermelho:</strong> {vermelho}</p></section>
      <section className="report-box"><h3>2. Totais por Engajamento</h3><p><strong>Alto:</strong> {alto}</p><p><strong>Médio:</strong> {medio}</p><p><strong>Baixo:</strong> {baixo}</p></section>
      <section className="report-box"><h3>3. Lista de Diretores</h3>{baseOrdenada.map((r)=><div className="report-item" key={`${r.id}-diretor`}><p><strong>Escola:</strong> {r.escola}</p><p><strong>Nome:</strong> {r.diretor || "Não informado"}</p><p><strong>Município:</strong> {r.municipio}</p><p><strong>Classificação:</strong> {r.classificacaoDiretor || "Não informado"}</p><p><strong>Engajamento:</strong> {r.interesseAgendaDiretor || "Não informado"}</p><p><strong>Observações:</strong> {r.observacoesDiretor || "Sem observações"}</p></div>)}</section>
      <section className="report-box"><h3>4. Lista de Diretores Adjuntos</h3>{baseOrdenada.map((r)=><div className="report-item" key={`${r.id}-adjunto`}><p><strong>Escola:</strong> {r.escola}</p><p><strong>Nome:</strong> {r.adjunto || "Não informado"}</p><p><strong>Município:</strong> {r.municipio}</p><p><strong>Classificação:</strong> {r.classificacaoAdjunto || "Não informado"}</p><p><strong>Engajamento:</strong> {r.interesseAgendaAdjunto || "Não informado"}</p><p><strong>Observações:</strong> {r.observacoesAdjunto || "Sem observações"}</p></div>)}</section>
      <section className="report-box"><h3>5. Indicadores Demandas</h3>{graficoCheckbox("Demandas da Escola","demandas",demandasOpcoes)}{graficoCheckbox("Questões Administrativas","administrativas",administrativasOpcoes)}</section>
      <section className="report-box"><h3>6. Percepção Institucional</h3>{graficoPercepcao("Diretor(a): Como avalia a SED?","avaliacaoSedDiretor")}{graficoPercepcao("Diretor(a): Como avalia o Governo?","avaliacaoGovernoDiretor")}{graficoPercepcao("Adjunto(a): Como avalia a SED?","avaliacaoSedAdjunto")}{graficoPercepcao("Adjunto(a): Como avalia o Governo?","avaliacaoGovernoAdjunto")}</section>
    </div>;
  }

  // As telas são funções de renderização locais. Chamá-las diretamente evita
  // remount completo da tela a cada alteração de estado (ex.: digitação em textarea).
  if (!autenticado) return TelaLogin();
  if (formAberto) return TelaFormularioAberto();
  if (filtroAtivo) return TelaListaFiltro();
  if (tela === "formularios") return TelaFormularios();
  if (tela === "graficos") return TelaGraficos();
  if (tela === "politico") return TelaPolitica();
  if (tela === "dobradinha") return TelaDobradinha();
  if (tela === "relatorio") return TelaRelatorio();
  return TelaInicio();
}
