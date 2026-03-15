package br.com.kanban.servico;

import br.com.kanban.entidade.Tarefa;
import br.com.kanban.entidade.Membro;
import br.com.kanban.repositorio.TarefaRepositorio;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TarefaServico {

    private final TarefaRepositorio tarefaRepositorio;

    public TarefaServico(TarefaRepositorio tarefaRepositorio) {
        this.tarefaRepositorio = tarefaRepositorio;
    }

    public Tarefa salvarTarefa(Tarefa tarefa) {
        return tarefaRepositorio.save(tarefa);
    }

    public List<Tarefa> listarTodas() {
        return tarefaRepositorio.findAll();
    }

    public List<Tarefa> listarPorMembro(Membro membro) {
        return tarefaRepositorio.findByMembro(membro);
    }

    public void alternarStatus(Long id) {
        tarefaRepositorio.findById(id).ifPresent(t -> {
            t.setConcluida(!t.isConcluida());
            tarefaRepositorio.save(t);
        });
    }

    public void excluir(Long id) {
        tarefaRepositorio.deleteById(id);
    }
}
