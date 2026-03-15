package br.com.kanban.repositorio;

import br.com.kanban.entidade.Tarefa;
import br.com.kanban.entidade.Membro;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TarefaRepositorio extends JpaRepository<Tarefa, Long> {
    List<Tarefa> findByMembro(Membro membro);
}
