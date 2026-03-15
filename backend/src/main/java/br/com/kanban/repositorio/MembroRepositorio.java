package br.com.kanban.repositorio;

import br.com.kanban.entidade.Membro;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MembroRepositorio extends JpaRepository<Membro, Long> {
    Optional<Membro> findByUsuario(String usuario);
}
