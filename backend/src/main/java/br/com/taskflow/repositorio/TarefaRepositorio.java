package br.com.taskflow.repositorio;

import br.com.taskflow.entidade.Tarefa;
import br.com.taskflow.entidade.Membro;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TarefaRepositorio extends JpaRepository<Tarefa, Long> {
    List<Tarefa> findByMembro(Membro membro);
}
