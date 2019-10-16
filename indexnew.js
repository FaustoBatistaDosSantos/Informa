'use strict';
var scopeFull = null;
var enCredencialStatus = {
    Preenchida: 1,
    Impressa: 2,
    Reimpressa: 4,
    Cancelada: 8,
    1: 'Preenchida',
    2: 'Impressa',
    4: 'Reimpressa',
    8: 'Cancelada',
};

var currentModal;
var FORM_SELECTOR = '#credencial-atualizar-form';

angular.module("informaApp")

.filter('statusFilter', function () {
    return function (data, status) {
        return data.reduce(function (filtered, item) {
            if ((status == '' && item.IdCredencialStatus != enCredencialStatus.Cancelada)
                || item.IdCredencialStatus == status) {
                filtered.push(item);
            } else {
                item.selecionado = false;
            }
            return filtered;
        }, []);
    }
})


.filter('ativosFilter', function () {
    return function (data) {
        return data.reduce(function (filtered, item) {
            if (item.IdCredencialStatus != enCredencialStatus.Cancelada) {
                filtered.push(item);
            }
            return filtered;
        }, []);
    }
})

.filter('canceladosFilter', function () {
    return function (data) {
        return data.reduce(function (filtered, item) {
            if (item.IdCredencialStatus == enCredencialStatus.Cancelada) {
                filtered.push(item);
            }
            return filtered;
        }, []);
    }
})

.controller("credencialListar", ['$scope', '$http', '$filter', '$compile', '$modal', 'frontendManager', function ($scope, $http, $filter, $compile, $modal, frontendManager) {

    if ($scope.contrato == undefined) {
        $scope.contrato = null;
    }

    if ($scope.pessoa == undefined) {
        $scope.pessoa = null;
    }


    $scope.pessoas = [];

    $scope.IsCNH = false;
    $scope.IsCPF = false;
    $scope.IsRG = false;
    $scope.IsInternacional = false;

    $scope.todasSelecionadas = false;
    $scope.imprimeTodas = false;
    $scope.pessoasTipoInfo = [];
    $scope.pessoasTipoInfo[enPessoaTipo.Expositor] = { class: "label-success", text: i18n.Exhibitor };
    $scope.pessoasTipoInfo[enPessoaTipo.Coexpositor] = { class: "label-success", text: i18n.CoExhibitor };
    $scope.pessoasTipoInfo[enPessoaTipo.Montador] = { class: "label-primary", text: i18n.Builder };
    $scope.pessoasTipoInfo[enPessoaTipo.Prestador] = { class: "label-info", text: i18n.Provider };
    $scope.pessoasTipoInfo[enPessoaTipo.Marca] = { class: "label-danger", text: i18n.Brand };

    $scope.status = '';
    $scope.credenciais = [];
    $scope.credenciaisInserir = [];

    $scope.credenciaisConcat = [];

    $scope.credenciaisSelecionadas = [];
    $scope.enCredencialStatus = enCredencialStatus;
    var tipos = null;
    var marcas = null;

    var credenciaisAtualizar = function () {

        // frontendManager.showLoader();
        $scope.credenciaisSelecionadas = [];
        $scope.status = '';

        $http.post(listar, {
            evento: $scope.contrato.IdEvento,
            contrato: $scope.contrato.IdContrato,
            pessoa: $scope.pessoa.IdPessoa,
        })

        .success(function (data) {

            var IsAdminPublic = data.IsAdministrador;


            $("#tableCredencial").dataTable().fnDestroy();

            $("#tableCredencial").DataTable({
                "aaData": data.Credenciais,
                order: [[0, "desc"]],
                columns: [
                            {
                                data: "IdCredencial",
                                className: "text-right",
                                render: function (data, type, full, meta) {

                                    var html = "<div class='m-l-sm'>" +
                                       " <label class='switch-container m-none'>" +
                                            "<span class='i-switch'>" +
                                             "   <input type='checkbox' ng-click='selecionarCredencial(" + data + ")' />" +
                                                "<i></i>" +
                                           " </span>" +
                                      "  </label>" +
                                   " </div>"

                                    return html;
                                }
                            },
                            {
                                data: "Nome"
                            },
                            { data: "Cargo" },
                            { data: "Empresa" },
                            {
                                data: "IdCredencialTipo",
                                render: function (data) {

                                    if (data == 1)
                                        return "Expositor";
                                    if (data == 2)
                                        return "Coexpositor";
                                    if (data == 3)
                                        return "Montador";
                                    if (data == 4)
                                        return "Prestador";
                                    if (data == 5)
                                        return "Estacionamento";
                                    if (data == 6)
                                        return "Segurança";
                                    if (data == 7)
                                        return "Marca";
                                    else
                                        return "Outros";
                                }
                            },
                              {
                                  data: "TipoDocumento"
                              },
                            {
                                data: "Documento"
                            },
                            {
                                data: "IdCredencialStatus",
                                render: function (data) {
                                    if (data == 1)
                                        return "Preenchida";
                                    if (data == 2)
                                        return "Impressa";
                                    if (data == 4)
                                        return "Reimpressa";
                                    if (data == 8)
                                        return "Cancelada";
                                    else
                                        return "Outros.";
                                }
                            },
                            {
                                data: "IdCredencial",
                                className: "text-right",
                                render: function (data, type, full, meta) {

                                    if (IsAdminPublic) {

                                        if (full.IdCredencialStatus == 2 || full.IdCredencialStatus == 4) {
                                            var button = $('<button />').addClass('btn btn-danger btn-addonV2 btn-xs').attr({
                                                'title': 'Cancelar',
                                                'data-toggle': 'tooltip',
                                                'ng-click': "cancelarCredencialSenha(" + data + ")",
                                                'data-val': full.IdCredencial,
                                                'cancelar-credencial': ''
                                            });
                                            button.append($("<i />").addClass('fa fa-remove')).append(' Excluir');

                                            var buttonAtualizar = $('<button />').addClass('btn btn-primary btn-addonV2 btn-xs').attr({
                                                'title': 'Editar',
                                                'data-toggle': 'tooltip',
                                                'ng-click': "atualizarCredencial(" + data + ")",
                                                'data-val': full.IdCredencial,
                                                'atualizar-credencial': ''
                                            });
                                            buttonAtualizar.append($("<i />").addClass('fa fa-pencil-square-o')).append(" Editar");


                                            return $('<div>').append(buttonAtualizar.clone()).append(button.clone()).html();

                                        }
                                        else {
                                            var button = $('<button />').addClass('btn btn-danger btn-addonV2 btn-xs').attr({
                                                'title': 'Cancelar',
                                                'data-toggle': 'tooltip',
                                                'ng-click': "cancelarCredencial(" + data + ")",
                                                'data-val': full.IdCredencial,
                                                'cancelar-credencial': ''
                                            });
                                            button.append($("<i />").addClass('fa fa-remove')).append(' Excluir');

                                            var buttonAtualizar = $('<button />').addClass('btn btn-primary btn-addonV2 btn-xs').attr({
                                                'title': 'Editar',
                                                'data-toggle': 'tooltip',
                                                'ng-click': "atualizarCredencial(" + data + ")",
                                                'data-val': full.IdCredencial,
                                                'atualizar-credencial': ''
                                            });
                                            buttonAtualizar.append($("<i />").addClass('fa fa-pencil-square-o')).append(" Editar");


                                            return $('<div>').append(buttonAtualizar.clone()).append(button.clone()).html();
                                        }


                                    }
                                    else {
                                        if (full.IdCredencialStatus == 2 || full.IdCredencialStatus == 4) {
                                            var button = $('<button />').addClass('btn btn-danger btn-addonV2 btn-xs').attr({
                                                'title': 'Cancelar',
                                                'data-toggle': 'tooltip',
                                                'ng-click': "cancelarCredencialSenha(" + data + ")",
                                                'data-val': full.IdCredencial,
                                                'cancelar-credencial': ''
                                            });
                                            button.append($("<i />").addClass('fa fa-remove'));

                                            return $('<div>').append(button.clone()).html();
                                        }
                                        else {
                                            var button = $('<button />').addClass('btn btn-danger btn-addonV2 btn-xs').attr({
                                                'title': 'Cancelar',
                                                'data-toggle': 'tooltip',
                                                'ng-click': "cancelarCredencial(" + data + ")",
                                                'data-val': full.IdCredencial,
                                                'cancelar-credencial': ''
                                            });
                                            button.append($("<i />").addClass('fa fa-remove'));

                                            return $('<div>').append(button.clone()).html();
                                        }
                                    }
                                }
                            }
                ],
                "fnCreatedRow": function (nRow, aData, iDataIndex) {
                    $compile(nRow)($scope);
                },
                columnDefs: [{
                    //Coluna de botões
                    targets: 8,
                    searchable: false,
                    orderable: false
                }]
            });

            //$scope.SaldoTotal_Perfil = data.SaldoTotal_Perfil;
            $scope.credenciaisTipo = data.Tipos;
            $scope.marcas = data.Marcas;

            //$scope.credenciaisSaldos = data.Saldos;

            $scope.credenciaisSolicitadas = data.Saldos[0].Solicitadas;
            $scope.credenciais = data.Credenciais;
            $scope.credenciaisTipo = data.CredencialTipo;
            $scope.credecialStatus = data.Status;

            $scope.ExibeBotaoExpositor = data.Saldos[0].ExibeBotaoExpositor;
            $scope.ExibeBotaoCoExpositor = data.Saldos[0].ExibeBotaoCoExpositor;
            $scope.ExibeBotaoPrestador = data.Saldos[0].ExibeBotaoPrestador;
            $scope.ExibeBotaoMontador = data.Saldos[0].ExibeBotaoMontador;
            $scope.ExibeBotaoSeguranca = data.Saldos[0].ExibeBotaoSeguranca;

            $scope.TotalUtilizadoCompExpositor = data.Saldos[0].TotalUtilizadoCompExpositor;
            $scope.TotalUtilizadoCompPrestador = data.Saldos[0].TotalUtilizadoCompPrestador;
            $scope.TotalUtilizadoCompMontador = data.Saldos[0].TotalUtilizadoCompMontador;
            $scope.TotalUtilizadaCompSeguranca = data.Saldos[0].TotalUtilizadaCompSeguranca;

            $scope.SaldoDisponCompCredExpositor = data.Saldos[0].SaldoDisponCompCredExpositor;
            $scope.SaldoDisponCompCredPrestador = data.Saldos[0].SaldoDisponCompCredPrestador;
            $scope.SaldoDisponCompCredMontador = data.Saldos[0].SaldoDisponCompCredMontador;
            $scope.SaldoDisponCompCredSeguranca = data.Saldos[0].SaldoDisponCompCredSeguranca;


            $scope.SaldoCompCredExpositor = data.Saldos[0].SaldoCompCredExpositor;
            $scope.SaldoCompCredPrestador = data.Saldos[0].SaldoCompCredPrestador;
            $scope.SaldoCompCredMontador = data.Saldos[0].SaldoCompCredMontador;
            $scope.SaldoCompCredSeguranca = data.Saldos[0].SaldoCompCredSeguranca;


            //$scope.totalCredenciaisSaldo = 0;

            //$scope.totalCredenciaisSaldo = $scope.credenciaisSaldos.reduce(function (acc, item) {
            //    return acc + item.SaldoComprado;
            //}, 0);

            tipos = $.map($scope.credenciaisTipo, function (value, index) {
                return {
                    id: parseInt(index, 10),
                    nome: value
                }
            });

            marcas = $.map($scope.marcas, function (value, index) {
                return {
                    id: parseInt(index, 10),
                    nome: value
                }
            });

            frontendManager.updateUI();
            frontendManager.hideLoader();
            $('#loading').hide();


        });
    }

    $scope.cancelarCredencial = function (idCredencial) {

        frontendManager.confirm("Deseja cancelar a credencial?", function () {
            frontendManager.showLoader();

            $http.post("/Credencial/Cancelar", { idCredencial: idCredencial, idContrato: $scope.contrato.IdContrato })
                .success(function (data, status, headers, config) {
                    if (data.Success) {
                        credenciaisAtualizar();
                        frontendManager.updateUI();
                        frontendManager.hideLoader();
                        $('#loading').hide();
                    } else {
                        frontendManager.error(data.Message);
                        frontendManager.hideLoader();
                    }
                });
        });
    }

    $scope.cancelarCredencialSenha = function (idCredencial) {

        frontendManager.updateUI();
        $('#loading').hide();

        frontendManager.confirm("Deseja cancelar a credencial?", function () {
            frontendManager.showLoader();

            //$http.post("/Credencial/Cancelar", { idCredencial: idCredencial, idContrato: $scope.contrato.IdContrato })
            //    .success(function (data, status, headers, config) {
            //        if (data.Success) {
            //            credenciaisAtualizar();
            //            frontendManager.updateUI();
            //            frontendManager.hideLoader();
            //            $('#loading').hide();
            //        } else {
            //            frontendManager.error(data.Message);
            //            frontendManager.hideLoader();
            //        }
            //    });

            scopeFull = $scope;

            currentModal = $modal.open({
                templateUrl: cancelar + "?idCredencial=" + idCredencial + "&idContrato=" + $scope.contrato.IdContrato + "&bust=" + Math.random().toString(36).slice(2),
                controller: 'credencialListar'
            });

            currentModal.opened.then(function (a) {
                frontendManager.updateUI();
                $('#loading').hide();
            });



        });
    }

    $scope.mudarContrato = function () {
        if (!$scope.pessoa) {
            $scope.contrato = null;
            return;
        }

        frontendManager.confirm("Deseja alterar o contrato selecionado? <br><br>OS DADOS NÃO SALVOS SERÃO PERDIDOS", function () {
            $scope.pessoa = null;
            $scope.contrato = null;
            $scope.totalCredenciaisSaldo = 0;
            $scope.SaldoTotal_Perfil = 0;

            document.getElementById("pendencia").style.display = "none";
        });
    }

    $scope.callbackContrato = function (contrato) {

        $scope.contrato = contrato;
    }

    $scope.evento = function (evento) {
        $scope.evento = evento;
    }

    $scope.selecionarPessoa = function (pessoa) {

        if (pessoa.Pendencia) {
            document.getElementById("pendencia").style.display = "block";
        } else {
            document.getElementById("pendencia").style.display = "none";
        }

        if ($scope.pessoa == pessoa)
            return;

        if (!$scope.pessoa) {
            $scope.pessoa = pessoa;

            return;
        }

        frontendManager.confirm("Deseja alterar a empresa selecionada? <br><br>OS DADOS NÃO SALVOS SERÃO PERDIDOS", function () {
            $scope.pessoa = pessoa;
            $scope.credenciaisInserir = [];
        });
    }

    $scope.$watch("contrato", function (value) {
        $scope.pessoas = [];
        $scope.items = [];

        if (value) {
            if (value.IdContrato != undefined) {
                frontendManager.showLoader();
                $http.post(listarPessoasUrl, { id: value.IdContrato })
                    .success(function (data) {
                        $scope.pessoas = data;
                        frontendManager.updateUI();
                        frontendManager.hideLoader();
                        $('#loading').hide();
                    });
            }
        }
    });

    $scope.$watch("pessoa", function (value) {

        if (!$scope.contrato || !value) {
            return;
        }

        credenciaisAtualizar();
    });

    $scope.credenciaisTipoFiltrados = function (idTipo) {
        return tipos.filter(function (tipo) {
            var tipoPorPessoa = $scope.pessoa.Tipos[0] == tipo.id;
            return tipoPorPessoa;
        });

    }

    $scope.marcasFiltradas = function () {
        return marcas;
    }

    $scope.calcularCredencialSaldo = function (grupo) {
        return $scope.credenciais.filter(function (item) {
            return item.IdCredencialStatus != enCredencialStatus.Cancelada && grupo.CredenciaisTipos.contains(parseInt(item.IdCredencialTipo, 10));
        }).length;
    }

    $scope.calcularTipoSaldo = function (tipo) {
        return $scope.credenciais.count(function (item) {
            return item.IdCredencialTipo == tipo && item.IdCredencialStatus != enCredencialStatus.Cancelada;
        });
    }
    


    $scope.adicionarCredencialExpositor = function () {

        if ($scope.pessoa.Tipos[0] == 4) {
            frontendManager.alert("Prezado usuário, Prestador de Serviço, não pode preencher credencial de expositor! por favor realize a transferência da credencial para o Expositor!");
            return;
        }

        var total = 0;

        $scope.credenciaisInserir.forEach(function (value, key) {
            if (value.IdCredencialTipo == $scope.pessoa.Tipos[0]) {
                total++;
            }
        });

        var inserir = (total + 1) + $scope.TotalUtilizadoCompExpositor;

        if (inserir <= $scope.SaldoCompCredExpositor) {
            $scope.credenciaisInserir.unshift({ IdCredencial: 0, Barcode: '-', IdCredencialStatus: enCredencialStatus.Preenchida, IdCredencialTipo: $scope.pessoa.Tipos[0] });
            // frontendManager.updateUI();
        }
        else {
            frontendManager.alert("Realizar compra de cota adicional.");
        }

        setTimeout(function () {


            var e = document.getElementById("ddlTipoDocumento");

            var opcao = e.options[e.selectedIndex].value;

            $scope.IsCNH = false;
            $scope.IsCPF = false;
            $scope.IsRG = false;
            $scope.IsInternacional = false;

            if (opcao == 'RG') {
                $scope.IsRG = true;
            }
            if (opcao == 'CNH') {
                $scope.IsCNH = true;
            }
            if (opcao == 'CPF') {
                $scope.IsCPF = true;
                $(".cpfmask").mask("999.999.999-99");

            }
            if (opcao == 'Internacional') {
                $scope.IsInternacional = true;
            }

            $(".digita").on({
                onclick: function (e) {
                    $('#hdControleFoco').val(e.target.id);
                    console.log($('#hdControleFoco').val());

                }, mousedown: function (e) {
                    $('#hdControleFoco').val(e.target.id);
                    console.log($('#hdControleFoco').val());

                }, mousedown: function (e) {
                    $('#hdControleFoco').val(e.target.id);
                    console.log($('#hdControleFoco').val());
                }
            });



        }, 1000);



    }

    $scope.adicionarCredencialSeguranca = function () {

        var total = 0;

        $scope.credenciaisInserir.forEach(function (value, key) {
            if (value.IdCredencialTipo == 6) {
                total++;
            }
        });

        var inserir = (total + 1) + $scope.TotalUtilizadaCompSeguranca;


        if (inserir <= $scope.SaldoCompCredSeguranca) {
            $scope.credenciaisInserir.unshift({ IdCredencial: 0, Barcode: '-', IdCredencialStatus: enCredencialStatus.Preenchida, IdCredencialTipo: 6 });
            //frontendManager.updateUI();
        }
        else {
            frontendManager.alert("Realizar compra de cota adicional.");
        }

        setTimeout(function () {


            var e = document.getElementById("ddlTipoDocumento");

            var opcao = e.options[e.selectedIndex].value;

            $scope.IsCNH = false;
            $scope.IsCPF = false;
            $scope.IsRG = false;
            $scope.IsInternacional = false;

            if (opcao == 'RG') {
                $scope.IsRG = true;
            }
            if (opcao == 'CNH') {
                $scope.IsCNH = true;
            }
            if (opcao == 'CPF') {
                $scope.IsCPF = true;
                $(".cpfmask").mask("999.999.999-99");
            }
            if (opcao == 'Internacional') {
                $scope.IsInternacional = true;
            }

            $(".digita").on({
                onclick: function (e) {
                    $('#hdControleFoco').val(e.target.id);
                    console.log($('#hdControleFoco').val());

                }, mousedown: function (e) {
                    $('#hdControleFoco').val(e.target.id);
                    console.log($('#hdControleFoco').val());

                }, mousedown: function (e) {
                    $('#hdControleFoco').val(e.target.id);
                    console.log($('#hdControleFoco').val());
                }
            });

        }, 1000);
    }
    
    $scope.adicionarCredencialMontador = function () {

        var total = 0;

        $scope.credenciaisInserir.forEach(function (value, key) {

            if (value.IdCredencialTipo == 3) {
                total++;
            }
        });

        //var inserir = ($scope.credenciaisInserir.length + 1) + $scope.TotalUtilizadoCompMontador;
        var inserir = (total + 1) + $scope.TotalUtilizadoCompMontador;

        if (inserir <= $scope.SaldoCompCredMontador) {
            $scope.credenciaisInserir.unshift({ IdCredencial: 0, Barcode: '-', IdCredencialStatus: enCredencialStatus.Preenchida, IdCredencialTipo: 3 });
        }
        else {
            frontendManager.alert("Realizar compra de cota adicional.");
        }

        setTimeout(function () {


            var e = document.getElementById("ddlTipoDocumento");

            var opcao = e.options[e.selectedIndex].value;

            $scope.IsCNH = false;
            $scope.IsCPF = false;
            $scope.IsRG = false;
            $scope.IsInternacional = false;

            if (opcao == 'RG') {
                $scope.IsRG = true;
            }
            if (opcao == 'CNH') {
                $scope.IsCNH = true;
            }
            if (opcao == 'CPF') {
                $scope.IsCPF = true;
                $(".cpfmask").mask("999.999.999-99");
            }
            if (opcao == 'Internacional') {
                $scope.IsInternacional = true;
            }

            $(".digita").on({
                onclick: function (e) {
                    $('#hdControleFoco').val(e.target.id);
                    console.log($('#hdControleFoco').val());

                }, mousedown: function (e) {
                    $('#hdControleFoco').val(e.target.id);
                    console.log($('#hdControleFoco').val());

                }, mousedown: function (e) {
                    $('#hdControleFoco').val(e.target.id);
                    console.log($('#hdControleFoco').val());
                }
            });

        }, 1000);
    }

    $scope.adicionarCredencialPrestador = function () {

        var total = 0;

        $scope.credenciaisInserir.forEach(function (value, key) {
            if (value.IdCredencialTipo == 4) {
                total++;
            }
        });

        var inserir = (total + 1) + $scope.TotalUtilizadoCompPrestador;

        if (inserir <= $scope.SaldoCompCredPrestador) {
            $scope.credenciaisInserir.unshift({ IdCredencial: 0, Barcode: '-', IdCredencialStatus: enCredencialStatus.Preenchida, IdCredencialTipo: 4 });
            // frontendManager.updateUI();
        }
        else {
            frontendManager.alert("Realizar compra de cota adicional.");
        }


        setTimeout(function () {


            var e = document.getElementById("ddlTipoDocumento");

            var opcao = e.options[e.selectedIndex].value;

            $scope.IsCNH = false;
            $scope.IsCPF = false;
            $scope.IsRG = false;
            $scope.IsInternacional = false;

            if (opcao == 'RG') {
                $scope.IsRG = true;
            }
            if (opcao == 'CNH') {
                $scope.IsCNH = true;
            }
            if (opcao == 'CPF') {
                $scope.IsCPF = true;
                $(".cpfmask").mask("999.999.999-99");
            }
            if (opcao == 'Internacional') {
                $scope.IsInternacional = true;
            }

            $(".digita").on({
                onclick: function (e) {
                    $('#hdControleFoco').val(e.target.id);
                    console.log($('#hdControleFoco').val());

                }, mousedown: function (e) {
                    $('#hdControleFoco').val(e.target.id);
                    console.log($('#hdControleFoco').val());

                }, mousedown: function (e) {
                    $('#hdControleFoco').val(e.target.id);
                    console.log($('#hdControleFoco').val());
                }
            });

        }, 1000);
    }
    


    $scope.removerCredencial = function (item) {
        $scope.credenciaisInserir.remove(item);
    }

    $scope.showCredencial = function (item) {
        return ($scope.status == '' || item.IdCredencialStatus == $scope.status) && item.IdCredencialStatus != enCredencialStatus.Cancelada && item.IdCredencialTipo == $scope.pessoa.Tipos[0];
    }

    $scope.filtraStatus = function () {
        var e = document.getElementById("statusCredencial");
        var statusCredencialFiltro = e.options[e.selectedIndex].text;

        if (statusCredencialFiltro == "Selecione o status") statusCredencialFiltro = "";

        $('#tableCredencial').DataTable().columns(7).search(statusCredencialFiltro).draw();
    }

    $scope.selecionarTodas = function () {
        $scope.credenciaisSelecionadas = [];

        if ($scope.imprimeTodas) {
            $scope.imprimeTodas = false;
            $('input:checkbox').prop('checked', false);
            return;
        }
        else {
            $scope.imprimeTodas = true;
            $('input:checkbox').prop('checked', true);
        }

        $filter('statusFilter')($scope.credenciais, $scope.status).forEach(function (item) {
            //if (item.IdCredencial == 0)
            //    return;

            //item.selecionado = $scope.todasSelecionadas;

            //if ($scope.todasSelecionadas) {
            $scope.credenciaisSelecionadas.push(item.IdCredencial);
            //}
        });

        $('input:checkbox').prop('checked', true);
    }

    $scope.selecionarCredencial = function (idCredencial) {

        if ($scope.credenciaisSelecionadas.indexOf(idCredencial) >= 0) {
            $scope.credenciaisSelecionadas.remove(idCredencial);

        } else {
            $scope.credenciaisSelecionadas.push(idCredencial);
        }
    }

    $scope.imprimir = function (urlGerar, urlImpressao) {
        if ($scope.credenciaisSelecionadas.length == 0) {
            frontendManager.alert("Nenhuma credencial selecionada");
            return;
        }

        frontendManager.confirm("Deseja imprimir as credenciais selecionadas?  <br><br><i class='fa fa-info-circle text-info m-r-xs'></i> AS CREDENCIAS SERÃO SALVAS ANTES DO PROCESSO", function () {

            frontendManager.showLoader();
            $http({
                method: "POST",
                url: urlGerar,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: $.param({ credenciais: $scope.credenciaisSelecionadas }, true)
            })
            .success(function (data) {
                window.open(urlImpressao + "?id=" + data);
                frontendManager.hideLoader();
                $('#loading').hide();
                credenciaisAtualizar();
            });
        });
    }

    $scope.imprimirStatus = function (urlGerar, urlImpressao) {

        var e = document.getElementById("statusCredencial");
        var idstatus = e.options[e.selectedIndex].value;

        // console.log(idstatus);


        frontendManager.confirm("Deseja imprimir todas as credenciais pelo status selecionado?  <br><br><i class='fa fa-info-circle text-info m-r-xs'></i> AS CREDENCIAS SERÃO SALVAS ANTES DO PROCESSO", function () {

            if (idstatus != "") {
                frontendManager.showLoader();

                $http({
                    method: "POST",
                    url: urlGerar,
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    data: $.param({
                        IdStatus: idstatus,
                        IdContrato: $scope.contrato.IdContrato,
                        IdPessoa: $scope.pessoa.IdPessoa
                    })
                })
                .success(function (data) {
                    window.open(urlImpressao + "?id=" + data);
                    frontendManager.hideLoader();
                    $('#loading').hide();
                    credenciaisAtualizar();
                });
            }
        });
    }

    $scope.cancelarsalvar = function () {
        $scope.credenciaisInserir = [];
    }

    $scope.salvar = function () {

        var form = $('#credencial-form');

        if (form.valid() == false) {
            $scope.status = enCredencialStatus.Preenchida;
            frontendManager.info();
        } else {

            $("#btnSalvar").attr("disabled", true);

            // frontendManager.showLoader();
            //$('#loading').show();

            //Inicia a requisição
            $http({
                method: "POST",
                url: form.attr('action'),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                data: form.serialize(),
            }).success(function (data, status, headers, config) {
                if (data.Success) {
                    //$('#loading').hide();

                    $('#btnSalvar').attr("disabled", false);

                    $scope.credenciaisInserir = [];
                    credenciaisAtualizar();

                } else {

                    var valNew = data.Message.split('|');

                    for (var i = 0; i < valNew.length; i++) {
                        if (valNew[i].length > 0) {
                            frontendManager.error(valNew[i]);
                        }
                    }
                    // frontendManager.error(data.Message);
                    $("#btnSalvar").attr("disabled", false);
                    //('#loading').hide();
                }
            }).error(function (data) {
                //$('#loading').hide();
                $("#btnSalvar").attr("disabled", false);
            });
        }
    }

    $scope.atualizarCredencial = function (idCredencial) {

        /// <summary>
        /// Cria um modal para editar ou criar uma nova categoria de acordo com a URL
        /// </summary>

        scopeFull = $scope;

        frontendManager.showLoader();
        $('#loading').show();

        currentModal = $modal.open({
            templateUrl: atualizar + "?idCredencial=" + idCredencial + "&idContrato=" + $scope.contrato.IdContrato + "&bust=" + Math.random().toString(36).slice(2),
            controller: 'credencialListar'
        });

        currentModal.opened.then(function (a) {
            frontendManager.updateUI();
            frontendManager.hideLoader();
            $('#loading').hide();
        });


    }

    $scope.fechar = function () {
        /// <summary>
        /// Fecha o modal de edição de categorias
        /// </summary>
        currentModal.dismiss();
        currentModal.close();

        $scope = scopeFull;
        credenciaisAtualizar();
        frontendManager.updateUI();
        frontendManager.hideLoader();
        $('#loading').hide();

    }

    $scope.atualizar = function ($event) {

        var form = $(FORM_SELECTOR);

        if (!form.valid()) {
            frontendManager.info();
        } else {
            $http({
                url: form.attr('action'),
                method: HTTP_SETTINGS.FORM_POST_METHOD,
                headers: HTTP_SETTINGS.FORM_POST_HEADERS,
                data: form.serialize(),
            }).success(function (data, status, headers, config) {

                if (data.Success) {

                    currentModal.dismiss();
                    currentModal.close();

                    $scope = scopeFull;

                    frontendManager.updateUI();
                    frontendManager.hideLoader();
                    $('#loading').hide();

                    credenciaisAtualizar();


                } else {
                    frontendManager.error(data.Message);
                }
            })
        }

        return false;
    }

    $scope.novoC = function (url) {


        url = url + "?IdContrato=" + $scope.contrato.IdContrato;




        frontendManager.showLoader();
        $modal.open({
            templateUrl: url,
            controller: 'historicoCriar'
        });
    }


    $scope.SelecionaTipoDocumento = function () {

        var e = document.getElementById("ddlTipoDocumento");

        $('.doc').val('');

        var opcao = e.options[e.selectedIndex].value;

        $scope.IsCNH = false;
        $scope.IsCPF = false;
        $scope.IsRG = false;
        $scope.IsInternacional = false;

        if (opcao == 'RG') {
            $scope.IsRG = true;
        }
        if (opcao == 'CNH') {
            $scope.IsCNH = true;
        }
        if (opcao == 'CPF') {
            $scope.IsCPF = true;
            $(".cpfmask").mask("999.999.999-99");
        }
        if (opcao == 'Internacional') {
            $scope.IsInternacional = true;
        }


        //console.log(opcao);
    }

    $scope.SelecionaTipoDocumentoCombo = function () {

        var e = document.getElementById("ddlTipoDocumento");

        var opcao = e.options[e.selectedIndex].value;

        $scope.IsCNH = false;
        $scope.IsCPF = false;
        $scope.IsRG = false;
        $scope.IsInternacional = false;

        if (opcao == 'RG') {
            $scope.IsRG = true;
        }
        if (opcao == 'CNH') {
            $scope.IsCNH = true;
        }
        if (opcao == 'CPF') {
            $scope.IsCPF = true;
            $(".cpfmask").mask("999.999.999-99");
        }
        if (opcao == 'Internacional') {
            $scope.IsInternacional = true;
        }


        //console.log(opcao);
    }


}]);